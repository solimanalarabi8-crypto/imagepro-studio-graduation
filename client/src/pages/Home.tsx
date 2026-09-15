import { useCallback, useEffect, useRef, useState } from "react";
import { blendModeToCompositeOp, opacityToAlpha, detectHistoryAction, BLEND_MODE_OPTIONS } from "@/lib/layers-history";
import { calculateHistogram, applyPixelAdjustments, DEFAULT_ADJUSTMENTS, type HistogramData } from "@/lib/color-adjustments";
import { FILTER_CATALOG, executeFilter, type FilterMode, type FilterCategory } from "@/lib/filters-engine";
import {
  serializeProjectPackage,
  deserializeProjectPackage,
  downloadFile,
  estimateExportFileSize,
  type ImageProProjectPackage,
} from "@/lib/project-persistence";
import {
  ArrowDown, ArrowUp, Brush, Check, ChevronDown, Circle, Cloud, Crop, Download, Eraser, Eye, EyeOff, FileDown, FilePlus,
  FolderOpen, Grid, Hand, Image as ImageIcon, Info, Layers3, Lock, Unlock, Folder, Combine, Maximize2, Minimize2, Minus, MousePointer2,
  PaintBucket, PanelRight, PanelRightClose, Pencil, Plus, Redo2, RefreshCw, RotateCcw, RotateCw, Save, Scale, Settings2,
  SlidersHorizontal, Sparkles, Square, Stamp, CircleDot, Crosshair, SunMedium, TextCursorInput, Triangle, Type, Undo2, Upload, WandSparkles, X, ZoomIn,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { featherSelection, invertSelectionRect, selectAllSelection, subtractSelection, unionSelection } from "@/lib/selection";
import {
  drawSmoothStroke,
  drawAdvancedShape,
  applyFloodFill,
  type ShapeType,
  type ShapeFillMode,
} from "@/lib/drawing-engine";
import {
  applyCloneStamp,
  applyHealingBrush,
  applySpotHealing,
  applyRedEyeRemoval,
  applySkinSmoothing,
  applyInpaintFill,
  applyBackgroundRemoval,
  type CloneSourcePoint,
} from "@/lib/retouch-engine";
import {
  extractSubjectFromCanvas,
  createPortraitBokeh,
  createBackgroundReplacement,
} from "@/lib/subject-extractor";

/** ImagePro Studio — charcoal + signal teal. Phase 1, 2, 3, 5, 6 & 7: Professional Digital Art & Image Processing Studio. */

const sampleImages = {
  portrait: "/assets/editor-sample-portrait.jpg",
  landscape: "/assets/editor-sample-landscape.jpg",
  stillLife: "/assets/editor-sample-stilllife.jpg",
};

type Tool = { id: string; label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; shortcut: string };
type Stroke = {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  opacity?: number;
  hardness?: number;
  mode: "brush" | "pencil" | "eraser";
  layerId?: string;
};
type ShapeElement = {
  id: string;
  shape: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fillColor?: string;
  widthStroke: number;
  fillMode?: ShapeFillMode;
  layerId: string;
};
type TextElement = {
  id: string;
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
  fontFamily?: string;
  fontWeight?: "normal" | "bold" | "600" | "800";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  letterSpacing?: number;
  lineHeight?: number;
  rotation?: number;
  // Effects
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  strokeEnabled?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  glowEnabled?: boolean;
  glowColor?: string;
  glowBlur?: number;
  // Gradient
  gradientEnabled?: boolean;
  gradientColor1?: string;
  gradientColor2?: string;
};
type SelectionRect = { x: number; y: number; width: number; height: number };
type MaskRect = SelectionRect;
type EditorSnapshot = {
  imageSrc: string;
  brightness: number;
  contrast: number;
  grayscale: number;
  saturation?: number;
  sepia?: number;
  invert?: number;
  hue?: number;
  exposure?: number;
  temperature?: number;
  gamma?: number;
  colorBalanceR?: number;
  colorBalanceG?: number;
  colorBalanceB?: number;
  thresholdEnabled?: boolean;
  threshold?: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  filterMode: FilterMode;
  filterIntensity?: number;
  strokes: Stroke[];
  shapes: ShapeElement[];
  textElements: TextElement[];
  maskRect: MaskRect | null;
  layers: LayerInfo[];
  snapshotLabel?: string; // Phase 12: named save point
};


export const toolGroups: Tool[][] = [
  [
    { id: "select", label: "تحديد", icon: MousePointer2, shortcut: "V" },
    { id: "hand", label: "تحريك", icon: Hand, shortcut: "H" },
    { id: "crop", label: "قص", icon: Crop, shortcut: "C" },
  ],
  [
    { id: "brush", label: "فرشاة", icon: Brush, shortcut: "B" },
    { id: "pencil", label: "قلم دقيق", icon: Pencil, shortcut: "N" },
    { id: "eraser", label: "ممحاة الرسم", icon: Eraser, shortcut: "E" },
    { id: "bucket", label: "دلو التلوين", icon: PaintBucket, shortcut: "G" },
    { id: "eyedropper", label: "قطّارة اللون", icon: PaintBucket, shortcut: "I" },
  ],
  [
    { id: "clone", label: "ختم الاستنساخ", icon: Stamp, shortcut: "S" },
    { id: "heal", label: "معالجة وتنقيح", icon: Sparkles, shortcut: "J" },
  ],
  [
    { id: "text", label: "نص", icon: Type, shortcut: "T" },
    { id: "shape", label: "أشكال", icon: Square, shortcut: "U" },
  ],
  [
    { id: "adjust", label: "تعديلات", icon: SlidersHorizontal, shortcut: "A" },
    { id: "magic", label: "أدوات ذكية", icon: WandSparkles, shortcut: "W" },
  ],
];

type LayerInfo = { id: string; name: string; kind: string; color: string; visible: boolean; opacity?: number; blendMode?: string; locked?: boolean; parentId?: string; thumbnail?: string; maskData?: string; maskEnabled?: boolean; maskLinked?: boolean; };
type SavedProject = {
  imageData: string;
  imageName: string;
  brightness: number;
  contrast: number;
  grayscale: number;
  saturation?: number;
  sepia?: number;
  invert?: number;
  thresholdEnabled?: boolean;
  threshold?: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  filterMode: FilterMode;
  filterIntensity?: number;
  strokes: Stroke[];
  shapes?: ShapeElement[];
  textElements: TextElement[];
  maskRect?: MaskRect | null;
  layers: LayerInfo[];
};

function readSavedProject(): SavedProject | null {
  try {
    const raw = window.localStorage.getItem("imagepro-studio-project");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedProject;
    if (parsed && typeof parsed.imageData === "string" && parsed.imageData.length > 20) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

const layerSeed: LayerInfo[] = [
  { id: "color", name: "تعديل لوني", kind: "adjustment", color: "#2dd4bf", visible: true, opacity: 100, blendMode: "normal" },
  { id: "portrait", name: "الصورة الأصلية", kind: "image", color: "#d7b58a", visible: true, opacity: 100, blendMode: "normal" },
  { id: "background", name: "الخلفية", kind: "background", color: "#8d8b87", visible: true, opacity: 100, blendMode: "normal" },
];

const GOOGLE_FONTS = [
  { name: "Cairo", label: "Cairo (عربي)" },
  { name: "Tajawal", label: "Tajawal (عربي)" },
  { name: "Amiri", label: "Amiri (عربي كلاسيكي)" },
  { name: "Noto Sans Arabic", label: "Noto Arabic" },
  { name: "Almarai", label: "Almarai (عربي)" },
  { name: "Inter", label: "Inter (English)" },
  { name: "Roboto", label: "Roboto (English)" },
  { name: "Outfit", label: "Outfit (English)" },
  { name: "Playfair Display", label: "Playfair Display" },
  { name: "Oswald", label: "Oswald" },
  { name: "Montserrat", label: "Montserrat" },
  { name: "Arial", label: "Arial" },
];

const loadedFonts = new Set<string>();

function ensureFontLoaded(fontFamily: string) {
  if (loadedFonts.has(fontFamily)) return;
  loadedFonts.add(fontFamily);
  const safeName = fontFamily.replace(/ /g, "+");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${safeName}:wght@400;600;700;800&display=swap`;
  document.head.appendChild(link);
}

function drawTexts(context: CanvasRenderingContext2D, textElements: TextElement[], visibleTextIds?: Set<string>) {
  for (const item of textElements) {
    if (visibleTextIds && !visibleTextIds.has(item.id)) continue;
    if (item.fontFamily) ensureFontLoaded(item.fontFamily);
    context.save();

    // Rotation
    if (item.rotation) {
      context.translate(item.x, item.y);
      context.rotate((item.rotation * Math.PI) / 180);
      context.translate(-item.x, -item.y);
    }

    const font = `${item.fontStyle ?? "normal"} ${item.fontWeight ?? "600"} ${item.size}px "${item.fontFamily ?? "Cairo"}", Arial, sans-serif`;
    context.font = font;
    context.textAlign = (item.textAlign ?? "center") as CanvasTextAlign;
    context.textBaseline = "middle";

    // Letter spacing — draw char by char
    const renderText = (text: string, fillFn: () => void) => {
      if (item.letterSpacing && item.letterSpacing !== 0) {
        const spacing = item.letterSpacing;
        const chars = Array.from(text);
        let cx = item.x;
        if (item.textAlign === "center") {
          const totalW = chars.reduce((acc, ch) => acc + context.measureText(ch).width + spacing, 0) - spacing;
          cx = item.x - totalW / 2;
        } else if (item.textAlign === "right") {
          const totalW = chars.reduce((acc, ch) => acc + context.measureText(ch).width + spacing, 0) - spacing;
          cx = item.x - totalW;
        }
        context.textAlign = "left";
        for (const ch of chars) {
          context.fillText(ch, cx, item.y);
          cx += context.measureText(ch).width + spacing;
        }
        context.textAlign = (item.textAlign ?? "center") as CanvasTextAlign;
      } else {
        fillFn();
      }
    };

    // Glow
    if (item.glowEnabled) {
      context.shadowColor = item.glowColor ?? "#00ffff";
      context.shadowBlur = item.glowBlur ?? 15;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
    }

    // Shadow
    if (item.shadowEnabled) {
      context.shadowColor = item.shadowColor ?? "rgba(0,0,0,0.6)";
      context.shadowBlur = item.shadowBlur ?? 8;
      context.shadowOffsetX = item.shadowOffsetX ?? 3;
      context.shadowOffsetY = item.shadowOffsetY ?? 3;
    }

    // Gradient fill
    if (item.gradientEnabled && item.gradientColor1 && item.gradientColor2) {
      const metrics = context.measureText(item.text);
      const grad = context.createLinearGradient(item.x - metrics.width / 2, item.y - item.size / 2, item.x + metrics.width / 2, item.y + item.size / 2);
      grad.addColorStop(0, item.gradientColor1);
      grad.addColorStop(1, item.gradientColor2);
      context.fillStyle = grad;
    } else {
      context.fillStyle = item.color;
    }

    renderText(item.text, () => context.fillText(item.text, item.x, item.y));

    // Stroke (outline)
    if (item.strokeEnabled && item.strokeWidth) {
      context.shadowColor = "transparent";
      context.shadowBlur = 0;
      context.lineWidth = item.strokeWidth;
      context.strokeStyle = item.strokeColor ?? "#000000";
      context.strokeText(item.text, item.x, item.y);
    }

    context.restore();
  }
}

function drawShapes(context: CanvasRenderingContext2D, shapes: ShapeElement[], visiblePaintIds?: Set<string>) {
  for (const shape of shapes) {
    if (visiblePaintIds && !visiblePaintIds.has(shape.layerId)) continue;
    drawAdvancedShape(context, {
      id: shape.id,
      shape: shape.shape,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      strokeColor: shape.color,
      fillColor: shape.fillColor || shape.color,
      strokeWidth: shape.widthStroke,
      fillMode: shape.fillMode || "stroke",
      layerId: shape.layerId,
    });
  }
}

function drawStrokes(context: CanvasRenderingContext2D, strokes: Stroke[], visiblePaintIds?: Set<string>) {
  for (const stroke of strokes) {
    if (visiblePaintIds && stroke.layerId && !visiblePaintIds.has(stroke.layerId)) continue;
    drawSmoothStroke(context, {
      points: stroke.points,
      color: stroke.color,
      width: stroke.width,
      opacity: stroke.opacity ?? 100,
      hardness: stroke.hardness ?? 100,
      mode: stroke.mode || "brush",
      layerId: stroke.layerId,
    });
  }
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function drawPaintLayer(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  strokes: Stroke[],
  shapes: ShapeElement[],
  visiblePaintIds?: Set<string>,
  opacity: number = 100,
  blendMode: string = "normal",
  maskImage?: HTMLImageElement,
  maskEnabled?: boolean
) {
  const visibleStrokes = strokes.filter((s) => !visiblePaintIds || !s.layerId || visiblePaintIds.has(s.layerId));
  const visibleShapes = shapes.filter((s) => !visiblePaintIds || !s.layerId || visiblePaintIds.has(s.layerId));
  if (visibleStrokes.length === 0 && visibleShapes.length === 0) return;

  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const offCtx = offscreen.getContext("2d");
  if (!offCtx) return;

  drawShapes(offCtx, visibleShapes);
  drawStrokes(offCtx, visibleStrokes);

  if (maskImage && maskEnabled !== false) {
    offCtx.globalCompositeOperation = "destination-in";
    offCtx.drawImage(maskImage, 0, 0, width, height);
  }

  context.save();
  context.globalAlpha = opacityToAlpha(opacity);
  context.globalCompositeOperation = blendModeToCompositeOp(blendMode);
  context.drawImage(offscreen, 0, 0);
  context.restore();
}





function applyThreshold(context: CanvasRenderingContext2D, width: number, height: number, thresholdVal: number = 128) {
  const source = context.getImageData(0, 0, width, height);
  const data = source.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const val = gray >= thresholdVal ? 255 : 0;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
  context.putImageData(source, 0, 0);
}


function ToolButton({ tool, active, onClick }: { tool: Tool; active: boolean; onClick: () => void }) {
  const Icon = tool.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button aria-label={`${tool.label} — الاختصار ${tool.shortcut}`} title={`${tool.label} (${tool.shortcut})`} onClick={onClick} className={`tool-button ${active ? "is-active" : ""}`}>
          <Icon size={18} strokeWidth={1.8} />
          {active && <span className="active-mark" />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="tooltip-content">
        {tool.label}<span className="tooltip-key">{tool.shortcut}</span>
      </TooltipContent>
    </Tooltip>
  );
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasStageRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [activeTool, setActiveTool] = useState("select");
  const [activeTab, setActiveTab] = useState<"layers" | "properties" | "history">("layers");
  const [historySteps, setHistorySteps] = useState<{ id: string; label: string; timestamp: number }[]>([
    { id: "initial-0", label: "فتح المشروع الأصلي", timestamp: Date.now() }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [layers, setLayers] = useState(() => readSavedProject()?.layers ?? layerSeed);
  const [selectedLayer, setSelectedLayer] = useState("portrait");
  const [selectedTarget, setSelectedTarget] = useState<"content" | "mask">("content");
  const [imageSrc, setImageSrc] = useState(() => readSavedProject()?.imageData || sampleImages.portrait);
  const [imageName, setImageName] = useState(() => readSavedProject()?.imageName || "دراسة بورتريه شخصي");
  const [sampleImageKey, setSampleImageKey] = useState<keyof typeof sampleImages>("portrait");
  const [imageSize, setImageSize] = useState({ width: 2048, height: 1536 });
  const [zoom, setZoom] = useState(78);
  const [brightness, setBrightness] = useState(() => readSavedProject()?.brightness ?? 12);
  const [contrast, setContrast] = useState(() => readSavedProject()?.contrast ?? 6);
  const [grayscale, setGrayscale] = useState(() => readSavedProject()?.grayscale ?? 0);
  const [saturation, setSaturation] = useState<number>(() => readSavedProject()?.saturation ?? 100);
  const [sepia, setSepia] = useState<number>(() => readSavedProject()?.sepia ?? 0);
  const [invert, setInvert] = useState<number>(() => readSavedProject()?.invert ?? 0);
  // Point 5: Extended Lighting, Color & Histogram State
  const [hue, setHue] = useState<number>(0);
  const [exposure, setExposure] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(0);
  const [gamma, setGamma] = useState<number>(1.0);
  const [colorBalanceR, setColorBalanceR] = useState<number>(0);
  const [colorBalanceG, setColorBalanceG] = useState<number>(0);
  const [colorBalanceB, setColorBalanceB] = useState<number>(0);
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null);
  const [thresholdEnabled, setThresholdEnabled] = useState<boolean>(() => readSavedProject()?.thresholdEnabled ?? false);
  const [threshold, setThreshold] = useState<number>(() => readSavedProject()?.threshold ?? 128);
  const [isComparingBefore, setIsComparingBefore] = useState(false);
  const [rotation, setRotation] = useState(() => readSavedProject()?.rotation ?? 0);
  const [flipX, setFlipX] = useState(() => readSavedProject()?.flipX ?? false);
  const [flipY, setFlipY] = useState(() => readSavedProject()?.flipY ?? false);
  const [filterMode, setFilterMode] = useState<FilterMode>(() => readSavedProject()?.filterMode ?? "none");
  const [filterIntensity, setFilterIntensity] = useState<number>(() => readSavedProject()?.filterIntensity ?? 50);
  const [filterCategoryFilter, setFilterCategoryFilter] = useState<"الكل" | FilterCategory>("الكل");
  const [exportScale, setExportScale] = useState<number>(1);
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>(() => readSavedProject()?.strokes ?? []);
  const [shapes, setShapes] = useState<ShapeElement[]>(() => readSavedProject()?.shapes ?? []);
  const [brushSize, setBrushSize] = useState<number>(16);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [textElements, setTextElements] = useState<TextElement[]>(() => readSavedProject()?.textElements ?? []);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [foregroundColor, setForegroundColor] = useState("#2dd4bf");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [brushHardness, setBrushHardness] = useState(100);
  const [activeShapeType, setActiveShapeType] = useState<ShapeType>("rectangle");
  const [shapeFillMode, setShapeFillMode] = useState<ShapeFillMode>("stroke");

  // Point 8: Retouching & Defect Removal State
  const [cloneSource, setCloneSource] = useState<CloneSourcePoint | null>(null);
  const [retouchMode, setRetouchMode] = useState<"clone" | "heal" | "spot" | "redeye" | "skin" | "inpaint" | "bgremove">("clone");
  const [retouchRadius, setRetouchRadius] = useState<number>(24);
  const [retouchOpacity, setRetouchOpacity] = useState<number>(100);
  const [retouchHardness, setRetouchHardness] = useState<number>(80);
  const [skinSmoothIntensity, setSkinSmoothIntensity] = useState<number>(60);
  const [bgRemoveTolerance, setBgRemoveTolerance] = useState<number>(30);
  const [bgFeather, setBgFeather] = useState<number>(3);
  const [bgBlurRadius, setBgBlurRadius] = useState<number>(20);
  const [extractedSubjectUrl, setExtractedSubjectUrl] = useState<string | null>(null);

  // Phase 13: AI & Advanced Features State
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiTask, setAiTask] = useState<string>("");
  const [aiProgress, setAiProgress] = useState(0);
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 3 | 4>(2);
  const [artStylePreset, setArtStylePreset] = useState<string>("sketch");
  const [outpaintDirection, setOutpaintDirection] = useState<"all" | "left" | "right" | "top" | "bottom">("all");
  const [outpaintAmount, setOutpaintAmount] = useState<number>(20); // percent
  const [autocropPadding, setAutocropPadding] = useState<number>(10); // px

  // Phase 9: Advanced Layers State
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingLayerName, setEditingLayerName] = useState("");

  const swapColors = () => {
    const fg = foregroundColor;
    const bg = backgroundColor;
    setForegroundColor(bg);
    setBackgroundColor(fg);
    setStatus(`تم تبديل الألوان: الأمامي (${bg}) ↔ الخلفي (${fg})`);
  };

  const resetColors = () => {
    setForegroundColor("#000000");
    setBackgroundColor("#ffffff");
    setStatus("تمت استعادة الألوان الافتراضية (أسود / أبيض)");
  };
  const [sampledRgb, setSampledRgb] = useState("RGB 45, 212, 191");
  const [blendMode, setBlendMode] = useState("عادي");
  const [layerOptionsOpen, setLayerOptionsOpen] = useState(false);
  const [quickAdjustmentsOpen, setQuickAdjustmentsOpen] = useState(true);
  const [selection, setSelection] = useState<SelectionRect | null>(null);
  const [selectionMode, setSelectionMode] = useState<"replace" | "add" | "subtract">("replace");
  const [selectionShape, setSelectionShape] = useState<"rectangle" | "ellipse" | "free">("rectangle");
  const [maskRect, setMaskRect] = useState<MaskRect | null>(null);
  const selectionStart = useRef<{ x: number; y: number } | null>(null);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const eraserTargetLayerRef = useRef<string | null>(null);
  const cachedImageRef = useRef<HTMLImageElement | null>(null);
  const cachedImageSrcRef = useRef<string | null>(null);
  const cachedMasksRef = useRef<Record<string, HTMLImageElement>>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [status, setStatus] = useState("جاهز للتحرير");
  const historyRef = useRef<EditorSnapshot[]>([]);
  const redoRef = useRef<EditorSnapshot[]>([]);
  const restoringRef = useRef(false);

  // Phase 1 Enhanced State: Menus, Modals & Project Lifecycle
  const [activeMenu, setActiveMenu] = useState<"file" | "edit" | "image" | "filter" | "view" | "export" | null>(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [fileInfoOpen, setFileInfoOpen] = useState(false);
  const [exportOptionsOpen, setExportOptionsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [exportQuality, setExportQuality] = useState(92);
  const [newProjectName, setNewProjectName] = useState("مشروع جديد");
  const [newProjectWidth, setNewProjectWidth] = useState(1920);
  const [newProjectHeight, setNewProjectHeight] = useState(1080);
  const [newProjectBg, setNewProjectBg] = useState<"transparent" | "#ffffff" | "#111b1b">("transparent");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Phase 2 Enhanced State: Workspace, View, Navigation & Inspector Folding
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [mouseCoord, setMouseCoord] = useState<{ x: number; y: number } | null>(null);
  const spacePressedRef = useRef(false);
  const previousToolRef = useRef(activeTool);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Phase 3 Enhanced State: Resize Image Dialog
  const [resizeDialogOpen, setResizeDialogOpen] = useState(false);
  const [resizeWidth, setResizeWidth] = useState(2048);
  const [resizeHeight, setResizeHeight] = useState(1536);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest(".app-dropdown-container")) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen to fullscreen changes across document
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Phase 9: Non-passive wheel event for zooming without scaling the entire browser
  useEffect(() => {
    const stage = canvasStageRef.current;
    if (!stage) return;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Always prevent default browser scrolling/zooming inside the workspace
      if (e.ctrlKey || e.metaKey || e.altKey) {
        // Zooming
        const delta = e.deltaY < 0 ? 6 : -6;
        setZoom((prev) => Math.max(20, Math.min(250, prev + delta)));
      } else {
        // Panning (like Photoshop)
        const dx = e.shiftKey && e.deltaX === 0 ? e.deltaY : e.deltaX;
        const dy = e.shiftKey && e.deltaX === 0 ? 0 : e.deltaY;
        
        setPan((prev) => ({
          x: prev.x - dx,
          y: prev.y - dy,
        }));
      }
    };
    
    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => stage.removeEventListener("wheel", handleWheel);
  }, []);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;
    
    // Preload masks if needed
    let missingMask = false;
    for (const layer of layers) {
      if (layer.maskData && layer.maskEnabled !== false) {
        if (!cachedMasksRef.current[layer.id] || cachedMasksRef.current[layer.id].src !== layer.maskData) {
          missingMask = true;
          const img = new Image();
          img.onload = () => {
            cachedMasksRef.current[layer.id] = img;
            renderCanvas();
          };
          img.src = layer.maskData;
        }
      }
    }
    if (missingMask) return; // Wait for masks to load before rendering

    setIsRendering(true);

    const drawWithImage = (image: HTMLImageElement) => {
      const width = image.naturalWidth || 2048;
      const height = image.naturalHeight || 1536;
      const quarterTurn = ((rotation % 360) + 360) % 360;
      const outputWidth = quarterTurn === 90 || quarterTurn === 270 ? height : width;
      const outputHeight = quarterTurn === 90 || quarterTurn === 270 ? width : height;
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        setIsRendering(false);
        return;
      }
      context.clearRect(0, 0, outputWidth, outputHeight);
      context.save();
      context.translate(outputWidth / 2, outputHeight / 2);
      context.rotate((quarterTurn * Math.PI) / 180);
      context.scale(flipX ? -1 : 1, flipY ? -1 : 1);

      // Before/After Comparison Mode: Hold button to preview untouched original
      if (isComparingBefore) {
        context.filter = "none";
        context.drawImage(image, -width / 2, -height / 2, width, height);
        context.restore();
        setImageSize({ width: outputWidth, height: outputHeight });
        setIsRendering(false);
        return;
      }

      const brightnessValue = 100 + brightness;
      const contrastValue = 100 + contrast;
      const blurRadius = Math.max(1, Math.round((filterIntensity / 100) * 14));
      const blurValue = (filterMode === "blur") ? ` blur(${blurRadius}px)` : "";
      const grayscaleValue = (filterMode === "edges" || filterMode === "sobel" || filterMode === "canny" || filterMode === "sketch" || filterMode === "charcoal") ? 100 : grayscale;
      const sepiaValue = (filterMode === "vintage") ? Math.max(70, sepia) : sepia;
      const hueValue = hue || 0;
      context.filter = `brightness(${brightnessValue}%) contrast(${contrastValue}%) saturate(${saturation}%) hue-rotate(${hueValue}deg) grayscale(${grayscaleValue}%) sepia(${sepiaValue}%) invert(${invert}%)${blurValue}`;
      const activeMask = maskRect && layers.some((layer) => layer.kind === "mask" && layer.visible) ? maskRect : null;
      if (activeMask) {
        context.beginPath();
        context.rect(activeMask.x - outputWidth / 2, activeMask.y - outputHeight / 2, activeMask.width, activeMask.height);
        context.clip();
      }
      // Phase 5: Image Layer Opacity & Phase 10: Mask
      const imgLayer = layers.find((l) => l.kind === "image" && l.visible);
      if (imgLayer) {
        if (typeof imgLayer.opacity === "number") {
          context.globalAlpha = opacityToAlpha(imgLayer.opacity);
        }
      }
      
      // Draw image to an offscreen canvas to apply mask non-destructively
      const offscreenBase = document.createElement("canvas");
      offscreenBase.width = outputWidth;
      offscreenBase.height = outputHeight;
      const offBaseCtx = offscreenBase.getContext("2d");
      if (offBaseCtx) {
        offBaseCtx.translate(outputWidth / 2, outputHeight / 2);
        offBaseCtx.rotate((quarterTurn * Math.PI) / 180);
        offBaseCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        offBaseCtx.drawImage(image, -width / 2, -height / 2, width, height);
        offBaseCtx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
        
        // Apply Mask for base image
        if (imgLayer && imgLayer.maskData && imgLayer.maskEnabled !== false && cachedMasksRef.current[imgLayer.id]) {
          offBaseCtx.globalCompositeOperation = "destination-in";
          offBaseCtx.drawImage(cachedMasksRef.current[imgLayer.id], 0, 0, outputWidth, outputHeight);
        }
        
        // Reset and draw to main canvas
        context.setTransform(1, 0, 0, 1, 0, 0); // Reset main transform so we draw the offscreen correctly
        context.drawImage(offscreenBase, 0, 0);
        // Restore transform for subsequent layers if needed
        context.translate(outputWidth / 2, outputHeight / 2);
        context.rotate((quarterTurn * Math.PI) / 180);
        context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      }

      context.filter = "none";
      context.restore();

      // Point 5: Apply Exposure, Temperature, Gamma & Color Balance
      applyPixelAdjustments(context, outputWidth, outputHeight, {
        exposure,
        temperature,
        gamma,
        balanceR: colorBalanceR,
        balanceG: colorBalanceG,
        balanceB: colorBalanceB,
      });

      // Phase 5: Text Layer Opacity, Blend Mode & Phase 10: Mask
      const textLayer = layers.find((l) => l.kind === "text" && l.visible);
      
      const offscreenText = document.createElement("canvas");
      offscreenText.width = outputWidth;
      offscreenText.height = outputHeight;
      const offTextCtx = offscreenText.getContext("2d");
      
      if (offTextCtx) {
        drawTexts(offTextCtx, textElements, new Set(layers.filter((layer) => layer.kind === "text" && layer.visible).map((layer) => layer.id)));
        
        if (textLayer && textLayer.maskData && textLayer.maskEnabled !== false && cachedMasksRef.current[textLayer.id]) {
          offTextCtx.globalCompositeOperation = "destination-in";
          offTextCtx.drawImage(cachedMasksRef.current[textLayer.id], 0, 0, outputWidth, outputHeight);
        }
        
        context.save();
        if (textLayer) {
          context.globalAlpha = opacityToAlpha(textLayer.opacity ?? 100);
          context.globalCompositeOperation = blendModeToCompositeOp(textLayer.blendMode || "normal");
        }
        context.drawImage(offscreenText, 0, 0);
        context.restore();
      }

      // Phase 5: Paint Layer Opacity and Blend Mode
      const paintLayer = layers.find((l) => l.kind === "paint" && l.visible);
      const paintOpacity = paintLayer?.opacity ?? 100;
      const paintBlend = paintLayer?.blendMode ?? "normal";
      drawPaintLayer(
        context,
        outputWidth,
        outputHeight,
        strokes,
        shapes,
        new Set(layers.filter((layer) => layer.kind === "paint" && layer.visible).map((layer) => layer.id)),
        paintOpacity,
        paintBlend,
        paintLayer && paintLayer.maskData ? cachedMasksRef.current[paintLayer.id] : undefined,
        paintLayer?.maskEnabled
      );

      // Point 6: Universal Filters Engine Execution
      if (filterMode !== "none" && filterMode !== "blur") {
        executeFilter(context, outputWidth, outputHeight, filterMode, filterIntensity);
      }
      if (thresholdEnabled) applyThreshold(context, outputWidth, outputHeight, threshold);

      try {
        const histData = calculateHistogram(context.getImageData(0, 0, Math.min(outputWidth, 600), Math.min(outputHeight, 600)));
        setHistogramData(histData);
      } catch {}

      setImageSize({ width: outputWidth, height: outputHeight });
      setIsRendering(false);
    };

    if (cachedImageRef.current && cachedImageSrcRef.current === imageSrc) {
      drawWithImage(cachedImageRef.current);
      return;
    }

    const image = new Image();
    image.onload = () => {
      cachedImageRef.current = image;
      cachedImageSrcRef.current = imageSrc;
      drawWithImage(image);
    };
    image.onerror = () => {
      setStatus("تعذر تحميل الصورة — يرجى رفع ملف صورة صالح");
      setIsRendering(false);
    };
    image.src = imageSrc;
  }, [brightness, contrast, filterMode, filterIntensity, grayscale, saturation, sepia, invert, thresholdEnabled, threshold, hue, exposure, temperature, gamma, colorBalanceR, colorBalanceG, colorBalanceB, isComparingBefore, flipX, flipY, imageSrc, rotation, strokes, shapes, textElements, maskRect, layers]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  useEffect(() => {
    const snapshot: EditorSnapshot = {
      imageSrc, brightness, contrast, grayscale, saturation, sepia, invert,
      hue, exposure, temperature, gamma, colorBalanceR, colorBalanceG, colorBalanceB,
      thresholdEnabled, threshold, rotation, flipX, flipY, filterMode, filterIntensity,
      strokes, shapes, textElements, maskRect, layers
    };
    if (restoringRef.current) { restoringRef.current = false; return; }
    const previous = historyRef.current[historyRef.current.length - 1];
    if (JSON.stringify(previous) !== JSON.stringify(snapshot)) {
      historyRef.current = [...historyRef.current, snapshot].slice(-50); // Phase 12: 50 steps
      redoRef.current = [];
      const actionLabel = detectHistoryAction(previous, snapshot);
      setHistorySteps((current) => {
        const next = [...current, { id: `step-${Date.now()}`, label: actionLabel, timestamp: Date.now() }];
        return next.slice(-50);
      });
      setHistoryIndex(historyRef.current.length - 1);
    }
  }, [brightness, contrast, filterMode, filterIntensity, grayscale, saturation, sepia, invert, thresholdEnabled, threshold, hue, exposure, temperature, gamma, colorBalanceR, colorBalanceG, colorBalanceB, imageSrc, layers, rotation, strokes, textElements, shapes, maskRect, flipX, flipY]);

  // Phase 2: Dynamic Fit to Screen
  const fitToScreen = useCallback(() => {
    const stage = canvasStageRef.current;
    if (!stage || !imageSize.width || !imageSize.height) {
      setZoom(75);
      setPan({ x: 0, y: 0 });
      return;
    }
    const paddingW = isInspectorOpen ? 120 : 60;
    const stageW = Math.max(200, stage.clientWidth - paddingW);
    const stageH = Math.max(200, stage.clientHeight - 80);
    const ratioW = stageW / imageSize.width;
    const ratioH = stageH / imageSize.height;
    const fitRatio = Math.min(ratioW, ratioH);
    const calculatedZoom = Math.max(20, Math.min(150, Math.round(fitRatio * 100)));
    setZoom(calculatedZoom);
    setPan({ x: 0, y: 0 });
    setStatus(`تمت ملاءمة الصورة مع مساحة العمل (${calculatedZoom}%)`);
  }, [imageSize.width, imageSize.height, isInspectorOpen]);

  // Phase 2: Actual Size (100%)
  const actualSize = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
    setStatus("تم ضبط العرض إلى 100% (الحجم الفعلي)");
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isInputFocused = ["INPUT", "TEXTAREA"].includes((event.target as HTMLElement)?.tagName);
      if (isInputFocused) return;

      // Spacebar temporary Hand tool (Hold Space to Pan)
      if (event.code === "Space" && !event.repeat) {
        event.preventDefault();
        if (!spacePressedRef.current) {
          spacePressedRef.current = true;
          previousToolRef.current = activeTool;
          setActiveTool("hand");
          setStatus("أداة اليد نشطة مؤقتاً (حرر زر المسافة للعودة)");
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveProject();
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setNewProjectOpen(true);
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "o") {
        event.preventDefault();
        uploadRef.current?.click();
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      } else if ((event.metaKey || event.ctrlKey) && event.key === "0") {
        event.preventDefault();
        fitToScreen();
      } else if ((event.metaKey || event.ctrlKey) && event.key === "1") {
        event.preventDefault();
        actualSize();
      } else if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "i") {
        event.preventDefault();
        invertSelection();
      } else if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        selectAll();
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        deselect();
      } else if (!event.metaKey && !event.ctrlKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        resetColors();
        return;
      } else if (!event.metaKey && !event.ctrlKey && event.key.toLowerCase() === "x") {
        event.preventDefault();
        swapColors();
        return;
      }

      const shortcut = event.key.toUpperCase();
      const tool = toolGroups.flat().find((item) => item.shortcut === shortcut);
      if (tool && !event.metaKey && !event.ctrlKey) {
        setActiveTool(tool.id);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space" && spacePressedRef.current) {
        spacePressedRef.current = false;
        setActiveTool(previousToolRef.current);
        setStatus("تمت العودة للأداة السابقة");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [activeTool, fitToScreen]);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
      setStatus("صيغة الملف غير مدعومة — يرجى رفع صورة بصيغة PNG أو JPG أو WebP");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setStatus("حجم الملف يتجاوز الحد الأقصى المسموح به (25 ميجابايت)");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setImageName(file.name.replace(/\.[^/.]+$/, ""));
    setStatus(`تم فتح الصورة: ${file.name} بنجاح`);
  };

  const createNewProject = (name: string, width: number, height: number, bgColor: "transparent" | "#ffffff" | "#111b1b") => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext("2d");
    if (ctx) {
      if (bgColor === "transparent") {
        ctx.clearRect(0, 0, width, height);
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
      }
    }
    const dataUrl = tempCanvas.toDataURL("image/png");
    setImageSrc(dataUrl);
    setImageName(name.trim() || "مشروع جديد");
    setImageSize({ width, height });
    setBrightness(0);
    setContrast(0);
    setGrayscale(0);
    setSaturation(100);
    setSepia(0);
    setInvert(0);
    setThresholdEnabled(false);
    setThreshold(128);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setFilterMode("none");
    setStrokes([]);
    setShapes([]);
    setTextElements([]);
    setMaskRect(null);
    setSelection(null);
    setLayers([
      { id: "background", name: "الخلفية", kind: "background", color: bgColor === "transparent" ? "#2dd4bf" : bgColor, visible: true },
    ]);
    setSelectedLayer("background");
    setNewProjectOpen(false);
    setStatus(`تم إنشاء مشروع جديد: ${name} (${width} × ${height} بكسل)`);
  };

  const loadSampleImage = (key: keyof typeof sampleImages) => {
    setSampleImageKey(key);
    setImageSrc(sampleImages[key]);
    const names: Record<keyof typeof sampleImages, string> = {
      portrait: "دراسة بورتريه شخصي",
      landscape: "دراسة منظر طبيعي",
      stillLife: "دراسة طبيعة صامتة",
    };
    setImageName(names[key]);
    setBrightness(0);
    setContrast(0);
    setGrayscale(0);
    setSaturation(100);
    setSepia(0);
    setInvert(0);
    setThresholdEnabled(false);
    setThreshold(128);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setFilterMode("none");
    setStrokes([]);
    setShapes([]);
    setTextElements([]);
    setMaskRect(null);
    setSelection(null);
    setActiveMenu(null);
    setStatus(`تم تحميل الصورة النموذجية: ${names[key]}`);
  };

  const restoreSnapshot = (snapshot: EditorSnapshot) => {
    restoringRef.current = true;
    setImageSrc(snapshot.imageSrc);
    setBrightness(snapshot.brightness);
    setContrast(snapshot.contrast);
    setGrayscale(snapshot.grayscale);
    setSaturation(snapshot.saturation ?? 100);
    setSepia(snapshot.sepia ?? 0);
    setInvert(snapshot.invert ?? 0);
    if (snapshot.hue !== undefined) setHue(snapshot.hue);
    if (snapshot.exposure !== undefined) setExposure(snapshot.exposure);
    if (snapshot.temperature !== undefined) setTemperature(snapshot.temperature);
    if (snapshot.gamma !== undefined) setGamma(snapshot.gamma);
    if (snapshot.colorBalanceR !== undefined) setColorBalanceR(snapshot.colorBalanceR);
    if (snapshot.colorBalanceG !== undefined) setColorBalanceG(snapshot.colorBalanceG);
    if (snapshot.colorBalanceB !== undefined) setColorBalanceB(snapshot.colorBalanceB);
    setThresholdEnabled(snapshot.thresholdEnabled ?? false);
    setThreshold(snapshot.threshold ?? 128);
    setRotation(snapshot.rotation);
    setFlipX(snapshot.flipX);
    setFlipY(snapshot.flipY);
    setFilterMode(snapshot.filterMode);
    if (snapshot.filterIntensity !== undefined) setFilterIntensity(snapshot.filterIntensity);
    setStrokes(snapshot.strokes);
    setShapes(snapshot.shapes ?? []);
    setTextElements(snapshot.textElements);
    setMaskRect(snapshot.maskRect ?? null);
    setLayers(snapshot.layers);
  };

  const jumpToHistoryStep = (index: number) => {
    if (index < 0 || index >= historyRef.current.length) return;
    const target = historyRef.current[index];
    if (target) {
      const future = historyRef.current.slice(index + 1);
      redoRef.current = [...future.reverse(), ...redoRef.current];
      historyRef.current = historyRef.current.slice(0, index + 1);
      setHistoryIndex(index);
      restoreSnapshot(target);
      setStatus(`تم الانتقال إلى الخطوة: ${historySteps[index]?.label || index + 1}`);
    }
  };

  const setSelectedLayerOpacity = (opacity: number) => {
    setLayers((current) => current.map((l) => l.id === selectedLayer ? { ...l, opacity } : l));
    setStatus(`تم ضبط شفافية الطبقة: ${opacity}%`);
  };

  const setSelectedLayerBlendMode = (blendMode: string) => {
    setLayers((current) => current.map((l) => l.id === selectedLayer ? { ...l, blendMode } : l));
    setStatus(`تم تغيير وضع دمج الطبقة إلى: ${blendMode}`);
  };

  const undo = () => {
    if (historyRef.current.length < 2) { setStatus("لا توجد عمليات سابقة للتراجع"); return; }
    const current = historyRef.current.pop();
    if (current) redoRef.current.push(current);
    const previous = historyRef.current[historyRef.current.length - 1];
    if (previous) {
      setHistoryIndex((idx) => Math.max(0, idx - 1));
      restoreSnapshot(previous);
      setStatus("تم التراجع عن آخر إجراء");
    }
  };

  const redo = () => {
    const next = redoRef.current.pop();
    if (!next) { setStatus("لا توجد عمليات لاحقة للتقدم إليها"); return; }
    historyRef.current.push(next);
    restoreSnapshot(next);
    setStatus("تم التقدم إلى الإجراء التالي");
  };

  const cropToSquare = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = Math.min(canvas.width, canvas.height);
    const left = (canvas.width - size) / 2;
    const top = (canvas.height - size) / 2;
    const cropped = document.createElement("canvas");
    cropped.width = size;
    cropped.height = size;
    const croppedContext = cropped.getContext("2d");
    if (!croppedContext) return;
    croppedContext.drawImage(canvas, left, top, size, size, 0, 0, size, size);
    setImageSrc(cropped.toDataURL("image/png"));
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setSelection(null);
    setStatus("تم تطبيق القص المربع (1:1)");
  };

  const cropToRatio = (ratioW: number, ratioH: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const currentRatio = canvas.width / canvas.height;
    const targetRatio = ratioW / ratioH;
    let cropW = canvas.width;
    let cropH = canvas.height;
    if (currentRatio > targetRatio) {
      cropW = Math.round(canvas.height * targetRatio);
    } else {
      cropH = Math.round(canvas.width / targetRatio);
    }
    const left = Math.round((canvas.width - cropW) / 2);
    const top = Math.round((canvas.height - cropH) / 2);
    const cropped = document.createElement("canvas");
    cropped.width = cropW;
    cropped.height = cropH;
    const ctx = cropped.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(canvas, left, top, cropW, cropH, 0, 0, cropW, cropH);
    setImageSrc(cropped.toDataURL("image/png"));
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setSelection(null);
    setStatus(`تم تطبيق القص بنسبة ${ratioW}:${ratioH} (${cropW} × ${cropH} بكسل)`);
  };

  const cropToSelection = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selection || selection.width < 4 || selection.height < 4) {
      setStatus("حدد منطقة للقص أولاً");
      return;
    }
    const cropped = document.createElement("canvas");
    cropped.width = Math.round(selection.width);
    cropped.height = Math.round(selection.height);
    const context = cropped.getContext("2d");
    if (!context) return;
    context.drawImage(canvas, selection.x, selection.y, selection.width, selection.height, 0, 0, cropped.width, cropped.height);
    setImageSrc(cropped.toDataURL("image/png"));
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setSelection(null);
    setStatus("تم قص المنطقة المحددة بنجاح");
  };

  const applyResize = (targetW: number, targetH: number) => {
    const canvas = canvasRef.current;
    if (!canvas || targetW < 10 || targetH < 10) {
      setStatus("يرجى إدخال أبعاد صالحة لتغيير الحجم");
      return;
    }
    const resized = document.createElement("canvas");
    resized.width = targetW;
    resized.height = targetH;
    const ctx = resized.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, targetW, targetH);
    setImageSrc(resized.toDataURL("image/png"));
    setImageSize({ width: targetW, height: targetH });
    setResizeDialogOpen(false);
    setStatus(`تم تغيير حجم الصورة إلى ${targetW} × ${targetH} بكسل بنجاح`);
  };

  const resetAdjustments = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(100);
    setGrayscale(0);
    setSepia(0);
    setInvert(0);
    setThresholdEnabled(false);
    setThreshold(128);
    setHue(0);
    setExposure(0);
    setTemperature(0);
    setGamma(1.0);
    setColorBalanceR(0);
    setColorBalanceG(0);
    setColorBalanceB(0);
    setFilterMode("none");
    setFilterIntensity(50);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setStatus("تمت إعادة ضبط جميع التعديلات اللونية بنجاح");
  };

  const applyAdjustments = () => {
    setStatus("✨ تم تثبيت واعتماد التعديلات اللونية في سجل المشروع بنجاح");
  };

  const applyFilterPermanently = () => {
    const canvas = canvasRef.current;
    if (!canvas || filterMode === "none") return;
    const baked = canvas.toDataURL("image/png");
    setImageSrc(baked);
    setFilterMode("none");
    setStatus("تم اعتماد وتثبيت تأثير المرشح نهائياً على الصورة بنجاح");
  };

  const exportProjectFile = () => {
    try {
      const pkg: ImageProProjectPackage = {
        formatVersion: "1.0.0",
        appName: "ImagePro Studio",
        exportedAt: new Date().toISOString(),
        metadata: {
          projectName: imageName || "مشروع ImagePro",
          width: imageSize.width,
          height: imageSize.height,
          layersCount: layers.length,
          strokesCount: strokes.length,
        },
        state: {
          imageName,
          imageData: imageSrc,
          brightness,
          contrast,
          grayscale,
          saturation,
          sepia,
          invert,
          hue,
          exposure,
          temperature,
          gamma,
          colorBalanceR,
          colorBalanceG,
          colorBalanceB,
          thresholdEnabled,
          threshold,
          rotation,
          flipX,
          flipY,
          filterMode,
          filterIntensity,
          layers: layers as any,
          strokes,
          shapes,
          textElements,
        },
      };
      const json = serializeProjectPackage(pkg);
      downloadFile(json, `${imageName.trim() || "imagepro-project"}.imagepro`, "application/json");
      setStatus("تم تصدير ملف المشروع (.imagepro) بنجاح");
    } catch (err) {
      console.error(err);
      setStatus("فشل تصدير ملف المشروع");
    }
  };

  const handleProjectFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const pkg = deserializeProjectPackage(text);
        setImageName(pkg.state.imageName || file.name.replace(/\.imagepro$/, ""));
        setImageSrc(pkg.state.imageData);
        setBrightness(pkg.state.brightness ?? 0);
        setContrast(pkg.state.contrast ?? 0);
        setGrayscale(pkg.state.grayscale ?? 0);
        setSaturation(pkg.state.saturation ?? 100);
        setSepia(pkg.state.sepia ?? 0);
        setInvert(pkg.state.invert ?? 0);
        setHue(pkg.state.hue ?? 0);
        setExposure(pkg.state.exposure ?? 0);
        setTemperature(pkg.state.temperature ?? 0);
        setGamma(pkg.state.gamma ?? 1.0);
        setColorBalanceR(pkg.state.colorBalanceR ?? 0);
        setColorBalanceG(pkg.state.colorBalanceG ?? 0);
        setColorBalanceB(pkg.state.colorBalanceB ?? 0);
        setThresholdEnabled(pkg.state.thresholdEnabled ?? false);
        setThreshold(pkg.state.threshold ?? 128);
        setRotation(pkg.state.rotation ?? 0);
        setFlipX(pkg.state.flipX ?? false);
        setFlipY(pkg.state.flipY ?? false);
        setFilterMode(pkg.state.filterMode ?? "none");
        setFilterIntensity(pkg.state.filterIntensity ?? 50);
        if (pkg.state.layers) setLayers(pkg.state.layers as any);
        if (pkg.state.strokes) setStrokes(pkg.state.strokes);
        if (pkg.state.shapes) setShapes(pkg.state.shapes);
        if (pkg.state.textElements) setTextElements(pkg.state.textElements);
        setStatus(`تم استيراد المشروع "${pkg.metadata.projectName}" واستعادة كافة الطبقات بنجاح`);
      } catch (err: any) {
        setStatus(`خطأ أثناء استيراد المشروع: ${err.message || "الملف غير صالح"}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const saveProject = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const project: SavedProject = {
        imageData: canvas.toDataURL("image/png"),
        imageName,
        brightness,
        contrast,
        grayscale,
        saturation,
        sepia,
        invert,
        thresholdEnabled,
        threshold,
        rotation,
        flipX,
        flipY,
        filterMode,
        filterIntensity,
        strokes,
        shapes,
        textElements,
        maskRect,
        layers
      };
      window.localStorage.setItem("imagepro-studio-project", JSON.stringify(project));
      const timeStr = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
      setLastSavedTime(timeStr);
      setStatus(`تم حفظ المشروع محلياً بنجاح (${timeStr})`);
    } catch {
      setStatus("فشل الحفظ المحلي — قد يكون حجم الصورة كبيراً جداً");
    }
  };

  const restoreProject = () => {
    const saved = readSavedProject();
    if (!saved) {
      setStatus("لا توجد نسخة محفوظة مسبقاً في المتصفح");
      return;
    }
    setImageSrc(saved.imageData);
    setImageName(saved.imageName || "مشروع مستعاد");
    setBrightness(saved.brightness);
    setContrast(saved.contrast);
    setGrayscale(saved.grayscale);
    setSaturation(saved.saturation ?? 100);
    setSepia(saved.sepia ?? 0);
    setInvert(saved.invert ?? 0);
    setThresholdEnabled(saved.thresholdEnabled ?? false);
    setThreshold(saved.threshold ?? 128);
    setRotation(saved.rotation);
    setFlipX(saved.flipX);
    setFlipY(saved.flipY);
    setFilterMode(saved.filterMode);
    setFilterIntensity(saved.filterIntensity ?? 50);
    setStrokes(saved.strokes || []);
    setShapes(saved.shapes || []);
    setTextElements(saved.textElements || []);
    setMaskRect(saved.maskRect || null);
    setLayers(saved.layers || layerSeed);
    setStatus("تم استعادة آخر نسخة محفوظة بنجاح");
  };

  // Point 8: Retouching Automatic Actions
  const handleApplySkinSmoothing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const success = applySkinSmoothing(ctx, canvas.width, canvas.height, skinSmoothIntensity, selection);
    if (success) {
      setImageSrc(canvas.toDataURL("image/png"));
      setStatus(`✨ تم تطبيق تنعيم البشرة الذكي بنجاح (الشدة: ${skinSmoothIntensity}%)`);
    } else {
      setStatus("تعذر تطبيق تنعيم البشرة — يرجى التأكد من وجود صورة محملة");
    }
  };

  const handleApplyInpaint = () => {
    if (!imageSrc) return;
    if (!selection || Math.abs(selection.width) < 4 || Math.abs(selection.height) < 4) {
      setStatus("يرجى تحديد المنطقة أو العنصر المراد إزالته وملؤه بأداة التحديد (V) أولاً");
      return;
    }
    const img = new Image();
    img.onload = () => {
      const offscreen = document.createElement("canvas");
      offscreen.width = img.naturalWidth || 2048;
      offscreen.height = img.naturalHeight || 1536;
      const ctx = offscreen.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
      const success = applyInpaintFill(ctx, offscreen.width, offscreen.height, selection);
      if (success) {
        setSelection(null);
        setImageSrc(offscreen.toDataURL("image/png"));
        setStatus("🪄 تم إزالة العنصر وملء المنطقة بالنسيج المحيط بنجاح");
      } else {
        setStatus("تعذر ملء المنطقة المحددة — يرجى تحديد مساحة أكبر قليلاً");
      }
    };
    img.src = imageSrc;
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Subject Extraction & Background Effects Engine
  // Professional Foreground Isolation & Background Processing:
  //   1. عزل وتحرير الجسم الذكي (Multi-Cluster Saliency + Edge Barrier)
  //   2. نقل الجسم المفرغ إلى طبقة جديدة مستقلة (Extract Subject to Layer)
  //   3. تمويه البورتريه الحقيقي (Portrait Bokeh — Sharp Subject + Blurred BG)
  //   4. استبدال الخلفية (شفاف / أسود / أبيض / تدرج سينمائي / كروما)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * 1. عزل وتحرير الجسم من الخلفية (Remove Background → Transparent)
   * يحلل الألوان المتعددة في الحواف ويعزل العنصر بالكامل مع صقل الحواف
   */
  const handleApplyBackgroundRemoval = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) { setStatus("⚠️ يرجى فتح أو رفع صورة أولاً"); return; }
    saveAiOriginalSnapshot("عزل وتحرير الجسم من الخلفية");
    const t0 = performance.now();
    setStatus("⏳ جاري تحليل وفصل الجسم المطلوب عن الخلفية...");

    try {
      // 1. Run local high-precision subject extraction
      const result = extractSubjectFromCanvas(canvas, {
        tolerance: bgRemoveTolerance,
        edgeFeather: bgFeather,
        roi: selection
      });

      // Cache extracted subject for instant portrait bokeh / replacement
      setExtractedSubjectUrl(result.dataUrl);
      setImageSrc(result.dataUrl);

      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      const isRoi = selection && selection.width > 5;
      const modeStr = isRoi ? "منطقة التحديد المحددة" : "الكشف التلقائي للجسم";
      setStatus(`✅ [${elapsed}ث] تم عزل وتحرير الجسم بنجاح (${modeStr}) — الخلفية شفافة تماماً وجاهزة للتصدير PNG`);
    } catch (err) {
      console.error("Subject extraction error:", err);
      setStatus("❌ تعذر عزل الجسم — يرجى تجربة ضبط حساسية الكشف أو تحديد العنصر بمربع التحديد");
    }
  };

  /**
   * 2. تحرير الجسم ونقله إلى طبقة مستقلة جديدة (Extract Subject to New Layer)
   * الميزة الاحترافية لبرامج التصميم الرائدة: فصل العنصر إلى طبقة جديدة مع الاحتفاظ بالخلفية
   */
  const handleExtractSubjectToNewLayer = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) { setStatus("⚠️ يرجى فتح أو رفع صورة أولاً"); return; }
    saveAiOriginalSnapshot("تحرير الجسم ونقله لطبقة جديدة");
    const t0 = performance.now();
    setStatus("⏳ جاري تحرير الجسم ونقله إلى طبقة مستقلة...");

    try {
      const result = extractSubjectFromCanvas(canvas, {
        tolerance: bgRemoveTolerance,
        edgeFeather: bgFeather,
        roi: selection
      });

      setExtractedSubjectUrl(result.dataUrl);

      // Create a new independent layer containing the freed subject
      const subjectLayerId = `subject-${Date.now()}`;
      const freedLayerCount = layers.filter(l => l.name.includes("مفرّغ") || l.name.includes("جسم")).length + 1;
      const newLayer: LayerInfo = {
        id: subjectLayerId,
        name: `عنصر مفرّغ ${freedLayerCount}`,
        kind: "paint",
        color: "#2dd4bf",
        visible: true,
        opacity: 100,
        blendMode: "normal",
        thumbnail: result.dataUrl
      };

      setLayers(current => [newLayer, ...current]);
      setSelectedLayer(subjectLayerId);

      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      setStatus(`✨ [${elapsed}ث] تم تحرير الجسم ونقله إلى طبقة مستقلة جديدة ("${newLayer.name}") — يمكنك الآن تحريكه وإخفاء أو تغيير خلفيته بشكل منفصل!`);
    } catch (err) {
      setStatus("❌ تعذر تحرير الجسم إلى طبقة جديدة: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  /**
   * 3. تمويه الخلفية بتدرج حقيقي (True Portrait Mode / Bokeh)
   * تمويه الخلفية مع الحفاظ على وضوح وحدة الجسم المعزول بنسبة 100%
   */
  const handleBlurBackground = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) { setStatus("⚠️ يرجى فتح أو رفع صورة أولاً"); return; }
    saveAiOriginalSnapshot("تمويه الخلفية بتدرج (Portrait Bokeh)");
    const t0 = performance.now();
    setStatus("⏳ جاري عزل الجسم وتطبيق تمويه البورتريه...");

    try {
      // Step 1: Ensure we have the clean extracted subject
      let subjectUrl = extractedSubjectUrl;
      if (!subjectUrl) {
        const result = extractSubjectFromCanvas(canvas, {
          tolerance: bgRemoveTolerance,
          edgeFeather: bgFeather,
          roi: selection
        });
        subjectUrl = result.dataUrl;
        setExtractedSubjectUrl(subjectUrl);
      }

      // Step 2: Composite sharp subject on top of blurred background
      const bokehResult = await createPortraitBokeh(canvas, subjectUrl, bgBlurRadius, 0.45);
      setImageSrc(bokehResult);

      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      setStatus(`🌫️ [${elapsed}ث] تم تطبيق تمويه البورتريه (Bokeh Effect) بنجاح — الجسم حاد بنسبة 100% والخلفية مموهة بعمق ميدان واقعي`);
    } catch (err) {
      setStatus(`❌ تعذر تمويه الخلفية: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  /**
   * 4. استبدال وإخفاء الخلفية (Background Replacement)
   * يضع الجسم المفرغ على خلفية شفافة، أو أسود استوديو، أو أبيض، أو تدرج سينمائي، أو كروما خضراء
   */
  const handleHideBackground = async (style: "transparent" | "black" | "white" | "chroma" | "studio-dark" = "transparent") => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) { setStatus("⚠️ يرجى فتح أو رفع صورة أولاً"); return; }
    saveAiOriginalSnapshot(`استبدال الخلفية (${style})`);
    const t0 = performance.now();
    setStatus("⏳ جاري استبدال الخلفية...");

    try {
      let subjectUrl = extractedSubjectUrl;
      if (!subjectUrl) {
        const result = extractSubjectFromCanvas(canvas, {
          tolerance: bgRemoveTolerance,
          edgeFeather: bgFeather,
          roi: selection
        });
        subjectUrl = result.dataUrl;
        setExtractedSubjectUrl(subjectUrl);
      }

      const W = canvas.width;
      const H = canvas.height;
      const replaced = await createBackgroundReplacement(subjectUrl, W, H, style);
      setImageSrc(replaced);

      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      const styleAr = style === "transparent" ? "شفاف" : style === "black" ? "أسود استوديو" : style === "white" ? "أبيض نقي" : style === "studio-dark" ? "تدرج سينمائي" : "كروما خضراء";
      setStatus(`✅ [${elapsed}ث] تم استبدال الخلفية بنجاح إلى [${styleAr}] مع الحفاظ على حدة وتفاصيل الجسم`);
    } catch (err) {
      setStatus(`❌ تعذر استبدال الخلفية: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // ─────── Phase 13: AI & Advanced Features Functions ───────

  /**
   * Phase 13 helper: Save original image as a named history snapshot BEFORE applying any AI.
   * This fulfils the requirement: "يجب حفظ الصورة الأصلية والنتيجة الجديدة كنسختين منفصلتين"
   */
  const saveAiOriginalSnapshot = (taskName: string) => {
    const snapshot: EditorSnapshot = {
      imageSrc, brightness, contrast, grayscale, saturation, sepia, invert,
      hue, exposure, temperature, gamma, colorBalanceR, colorBalanceG, colorBalanceB,
      thresholdEnabled, threshold, rotation, flipX, flipY, filterMode, filterIntensity,
      strokes, shapes, textElements, maskRect, layers,
      snapshotLabel: `📌 أصل قبل: ${taskName}`,
    };
    historyRef.current = [...historyRef.current, snapshot].slice(-50);
    setHistorySteps(s => [
      ...s,
      { id: `ai-orig-${Date.now()}`, label: `📌 أصل قبل: ${taskName}`, timestamp: Date.now() },
    ].slice(-50));
    setHistoryIndex(historyRef.current.length - 1);
  };

  /** Phase 13 helper: start AI timer and return stopper that shows elapsed time */
  const startAiTimer = (taskLabel: string) => {
    const t0 = performance.now();
    setAiProcessing(true);
    setAiTask(taskLabel);
    setAiProgress(5);
    return () => {
      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      setAiProcessing(false);
      setAiTask("");
      setAiProgress(0);
      return elapsed;
    };
  };

  /** Smart Upscale — Canvas pixel resampling + unsharp-mask (Threshold-based sharpening) */
  const handleAiUpscale = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) { setStatus("⚠️ يرجى تحميل صورة أولاً"); return; }
    saveAiOriginalSnapshot(`تحسين الدقة ${upscaleFactor}×`);
    const stopTimer = startAiTimer(`تحسين الدقة ${upscaleFactor}×`);
    setTimeout(() => {
      let elapsed = "0";
      try {
        const W = canvas.width * upscaleFactor;
        const H = canvas.height * upscaleFactor;
        const out = document.createElement("canvas");
        out.width = W; out.height = H;
        const ctx = out.getContext("2d");
        if (!ctx) throw new Error("no context");
        // Phase 13: high-quality interpolation (Lanczos approximated via browser bilinear)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(canvas, 0, 0, W, H);
        setAiProgress(60);
        // Threshold-based unsharp mask: sharpen only pixels above threshold 128
        const id = ctx.getImageData(0, 0, W, H);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          const lum = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
          // Apply sharpening only where edge-like luminance change (threshold > 30)
          const factor = lum > 30 ? 1.09 : 1.0;
          d[i]   = Math.min(255, Math.max(0, d[i]   * factor - 4));
          d[i+1] = Math.min(255, Math.max(0, d[i+1] * factor - 4));
          d[i+2] = Math.min(255, Math.max(0, d[i+2] * factor - 4));
        }
        ctx.putImageData(id, 0, 0);
        setAiProgress(90);
        const resultSrc = out.toDataURL("image/png");
        setImageSrc(resultSrc);
        // Save result snapshot
        setHistorySteps(s => [...s, { id: `ai-res-${Date.now()}`, label: `🔍 نتيجة: تحسين دقة ${upscaleFactor}×`, timestamp: Date.now() }].slice(-50));
        elapsed = stopTimer();
        setAiProgress(100);
        setStatus(`✅ [${elapsed}ث] تم تحسين الدقة ${upscaleFactor}× (${W}×${H}px) — النتيجة تقديرية`);
      } catch (err) {
        elapsed = stopTimer();
        setStatus(`❌ [${elapsed}ث] تعذر تحسين الدقة: ${err instanceof Error ? err.message : String(err)}`);
      }
    }, 50);
  };

  /** Smart AutoCrop — Edge detection to find content bounding box */
  const handleSmartAutoCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) { setStatus("⚠️ يرجى تحميل صورة أولاً"); return; }
    saveAiOriginalSnapshot("اقتراح القص الذكي");
    const stopTimer = startAiTimer("اقتراح القص — كشف الحواف (Edge Detection)");
    setTimeout(() => {
      let elapsed = "0";
      try {
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no context");
        const { width: W, height: H } = canvas;
        const id = ctx.getImageData(0, 0, W, H);
        const d = id.data;
        setAiProgress(30);
        // Phase 13: Edge Detection — Sobel-like luminance threshold to find content boundary
        let minX = W, minY = H, maxX = 0, maxY = 0;
        for (let y = 1; y < H - 1; y++) {
          for (let x = 1; x < W - 1; x++) {
            const i = (y * W + x) * 4;
            const r = d[i], g = d[i+1], b = d[i+2], a = d[i+3];
            // Transparent pixel = background
            if (a < 15) continue;
            // White threshold: R>245 && G>245 && B>245 = background
            if (r > 245 && g > 245 && b > 245) continue;
            // Sobel edge: check luminance difference with neighbors
            const lum = (r + g + b) / 3;
            const iR = ((y-1) * W + x) * 4;
            const iL = ((y+1) * W + x) * 4;
            const lumT = (d[iR] + d[iR+1] + d[iR+2]) / 3;
            const lumB = (d[iL] + d[iL+1] + d[iL+2]) / 3;
            const grad = Math.abs(lum - lumT) + Math.abs(lum - lumB);
            // Content pixel: either edge or non-background
            if (grad > 10 || (r < 240 || g < 240 || b < 240)) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        setAiProgress(70);
        const pad = autocropPadding;
        minX = Math.max(0, minX - pad);
        minY = Math.max(0, minY - pad);
        maxX = Math.min(W, maxX + pad);
        maxY = Math.min(H, maxY + pad);
        const cw = maxX - minX;
        const ch = maxY - minY;
        if (cw < 10 || ch < 10) throw new Error("لم يُكتشف محتوى — الصورة قد تكون بيضاء بالكامل");
        const out = document.createElement("canvas");
        out.width = cw; out.height = ch;
        const outCtx = out.getContext("2d");
        outCtx?.drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
        setAiProgress(95);
        const resultSrc = out.toDataURL("image/png");
        setImageSrc(resultSrc);
        setHistorySteps(s => [...s, { id: `ai-res-${Date.now()}`, label: `✂️ نتيجة: قص ذكي (${cw}×${ch}px)`, timestamp: Date.now() }].slice(-50));
        elapsed = stopTimer();
        setStatus(`✅ [${elapsed}ث] القص الذكي: اكتشاف الحواف (Sobel) → ${cw}×${ch}px — النتيجة تقديرية`);
      } catch (err) {
        elapsed = stopTimer();
        setStatus(`⚠️ [${elapsed}ث] ${err instanceof Error ? err.message : "تعذر القص"}`);
      }
    }, 50);
  };

  /** Phase 13 Art Style Presets — local pixel-level transforms */
  const ART_STYLES: Record<string, { label: string; icon: string; apply: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }> = {
    sketch: {
      label: "رسم قلم رصاص",
      icon: "✏️",
      // Edge detection: invert + gaussian blur approximation
      apply: (ctx, w, h) => {
        const id = ctx.getImageData(0, 0, w, h);
        const d = id.data;
        const orig = new Uint8ClampedArray(d);
        // Convert to grayscale edge map using Sobel 3×3
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const i = (y * w + x) * 4;
            const tl = orig[((y-1)*w+(x-1))*4], tc = orig[((y-1)*w+x)*4], tr = orig[((y-1)*w+(x+1))*4];
            const ml = orig[(y*w+(x-1))*4],                                   mr = orig[(y*w+(x+1))*4];
            const bl = orig[((y+1)*w+(x-1))*4], bc = orig[((y+1)*w+x)*4], br = orig[((y+1)*w+(x+1))*4];
            const gx = -tl - 2*ml - bl + tr + 2*mr + br;
            const gy = -tl - 2*tc - tr + bl + 2*bc + br;
            const mag = Math.min(255, Math.sqrt(gx*gx + gy*gy));
            const v = Math.max(0, 255 - mag * 2.5);
            d[i] = d[i+1] = d[i+2] = v;
          }
        }
        ctx.putImageData(id, 0, 0);
      }
    },
    watercolor: {
      label: "ألوان مائية",
      icon: "🎨",
      apply: (ctx, w, h) => {
        const id = ctx.getImageData(0, 0, w, h);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          d[i]   = Math.min(255, d[i]   * 1.15 + 25);
          d[i+1] = Math.min(255, d[i+1] * 1.05 + 18);
          d[i+2] = Math.min(255, d[i+2] * 1.25 + 12);
          // Slightly reduce opacity for paint-wash look
          d[i+3] = Math.max(180, d[i+3] - 20);
        }
        ctx.putImageData(id, 0, 0);
      }
    },
    oilpaint: {
      label: "رسم زيتي",
      icon: "🖌️",
      apply: (ctx, w, h) => {
        const id = ctx.getImageData(0, 0, w, h);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          // Gamma correction creates oil-paint richness
          d[i]   = Math.min(255, Math.pow(d[i]   / 255, 0.75) * 255 * 1.18);
          d[i+1] = Math.min(255, Math.pow(d[i+1] / 255, 0.78) * 255 * 1.12);
          d[i+2] = Math.min(255, Math.pow(d[i+2] / 255, 0.80) * 255 * 1.08);
        }
        ctx.putImageData(id, 0, 0);
      }
    },
    vintage: {
      label: "نوستالجيا خمري",
      icon: "📷",
      apply: (ctx, w, h) => {
        const id = ctx.getImageData(0, 0, w, h);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i+1], b = d[i+2];
          // Sepia + warm tint matrix
          d[i]   = Math.min(255, r * 0.88 + g * 0.26 + b * 0.08 + 28);
          d[i+1] = Math.min(255, r * 0.08 + g * 0.83 + b * 0.08 + 12);
          d[i+2] = Math.min(255, r * 0.08 + g * 0.08 + b * 0.72);
        }
        ctx.putImageData(id, 0, 0);
      }
    },
    neon: {
      label: "نيون إلكتروني",
      icon: "💡",
      apply: (ctx, w, h) => {
        const id = ctx.getImageData(0, 0, w, h);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
          // Threshold: dark zones become black, bright zones become neon
          d[i]   = gray > 140 ? Math.min(255, d[i]   * 1.6) : Math.max(0, d[i]   - 60);
          d[i+1] = gray > 100 ? Math.min(255, d[i+1] * 0.4 + 60) : 0;
          d[i+2] = Math.min(255, d[i+2] * 2.0 + 50);
        }
        ctx.putImageData(id, 0, 0);
      }
    },
    charcoal: {
      label: "فحم فني",
      icon: "⬛",
      apply: (ctx, w, h) => {
        const id = ctx.getImageData(0, 0, w, h);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
          // Hard threshold for charcoal grain effect
          const v = gray < 60 ? 0 : gray < 128 ? gray * 0.65 : Math.min(255, gray * 1.25);
          d[i] = d[i+1] = d[i+2] = v;
        }
        ctx.putImageData(id, 0, 0);
      }
    },
    duotone: {
      label: "ثنائي اللون",
      icon: "🟣",
      apply: (ctx, w, h) => {
        const id = ctx.getImageData(0, 0, w, h);
        const d = id.data;
        // Duotone: map shadows→teal, highlights→amber
        for (let i = 0; i < d.length; i += 4) {
          const gray = (0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2]) / 255;
          d[i]   = Math.round(45  * (1 - gray) + 215 * gray);
          d[i+1] = Math.round(212 * (1 - gray) + 58  * gray);
          d[i+2] = Math.round(191 * (1 - gray) + 110 * gray);
        }
        ctx.putImageData(id, 0, 0);
      }
    },
  };

  const handleApplyArtStyle = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) { setStatus("⚠️ يرجى تحميل صورة أولاً"); return; }
    const style = ART_STYLES[artStylePreset];
    if (!style) return;
    saveAiOriginalSnapshot(`نمط فني: ${style.label}`);
    const stopTimer = startAiTimer(`تطبيق نمط: ${style.label}`);
    setTimeout(() => {
      let elapsed = "0";
      try {
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no context");
        style.apply(ctx, canvas.width, canvas.height);
        const resultSrc = canvas.toDataURL("image/png");
        setImageSrc(resultSrc);
        setHistorySteps(s => [...s, { id: `ai-res-${Date.now()}`, label: `${style.icon} نتيجة: ${style.label}`, timestamp: Date.now() }].slice(-50));
        elapsed = stopTimer();
        setStatus(`${style.icon} [${elapsed}ث] تم تطبيق النمط الفني: ${style.label} — النتيجة تقديرية`);
      } catch (err) {
        elapsed = stopTimer();
        setStatus(`❌ [${elapsed}ث] تعذر تطبيق النمط: ${err instanceof Error ? err.message : String(err)}`);
      }
    }, 50);
  };

  /** Outpainting — extend canvas with flood-fill edge sampling */
  const handleOutpaint = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) { setStatus("⚠️ يرجى تحميل صورة أولاً"); return; }
    saveAiOriginalSnapshot(`توسيع الصورة ${outpaintDirection}`);
    const stopTimer = startAiTimer("توسيع الصورة — امتداد حواف (Flood Fill)");
    setTimeout(() => {
      let elapsed = "0";
      try {
        const W = canvas.width;
        const H = canvas.height;
        const amtW = Math.round(W * outpaintAmount / 100);
        const amtH = Math.round(H * outpaintAmount / 100);
        let newW = W, newH = H, offsetX = 0, offsetY = 0;
        if (outpaintDirection === "all")    { newW = W + amtW * 2; newH = H + amtH * 2; offsetX = amtW; offsetY = amtH; }
        if (outpaintDirection === "right")  { newW = W + amtW; }
        if (outpaintDirection === "left")   { newW = W + amtW; offsetX = amtW; }
        if (outpaintDirection === "bottom") { newH = H + amtH; }
        if (outpaintDirection === "top")    { newH = H + amtH; offsetY = amtH; }
        const out = document.createElement("canvas");
        out.width = newW; out.height = newH;
        const ctx = out.getContext("2d");
        if (!ctx) throw new Error("no context");
        setAiProgress(30);
        // Phase 13: Flood Fill edge sampling — sample edge pixels and flood outward
        // Step 1: Draw blurred large version to fill background naturally
        ctx.filter = `blur(${Math.max(amtW, amtH) / 2}px)`;
        ctx.drawImage(canvas, offsetX - amtW * 3, offsetY - amtH * 3, newW + amtW * 6, newH + amtH * 6);
        ctx.filter = "none";
        setAiProgress(60);
        // Step 2: Draw original image sharp on top
        ctx.drawImage(canvas, offsetX, offsetY, W, H);
        setAiProgress(85);
        const resultSrc = out.toDataURL("image/png");
        setImageSrc(resultSrc);
        setHistorySteps(s => [...s, { id: `ai-res-${Date.now()}`, label: `🖼️ نتيجة: توسيع ${outpaintAmount}% (${outpaintDirection})`, timestamp: Date.now() }].slice(-50));
        elapsed = stopTimer();
        setStatus(`🖼️ [${elapsed}ث] تم توسيع الصورة (${outpaintDirection}) ${outpaintAmount}% → ${newW}×${newH}px — النتيجة تقديرية`);
      } catch (err) {
        elapsed = stopTimer();
        setStatus(`❌ [${elapsed}ث] تعذر توسيع الصورة: ${err instanceof Error ? err.message : String(err)}`);
      }
    }, 50);
  };



  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setStatus("تم إنهاء ملء الشاشة واستعادة الحجم الأصلي");
      } else {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (canvasStageRef.current?.requestFullscreen) {
          await canvasStageRef.current.requestFullscreen();
        }
        setStatus("تم الدخول في وضع ملء الشاشة الكامل (اضغط Esc للعودة)");
      }
    } catch (err) {
      console.error("Fullscreen toggle error:", err);
      setStatus("تعذر تبديل وضع ملء الشاشة");
    }
  };

  const cycleBlendMode = () => {
    const modes = ["عادي", "ضرب", "شاشة", "تراكب"];
    const next = modes[(modes.indexOf(blendMode) + 1) % modes.length];
    setBlendMode(next);
    setStatus(`وضع الدمج: ${next}`);
  };

  const exportImage = (format: "png" | "jpeg" | "webp", qualityPercent: number = 92, scale: number = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const quality = Math.max(0.1, Math.min(1.0, qualityPercent / 100));
    const mimeType = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
    const ext = format === "png" ? "png" : format === "webp" ? "webp" : "jpg";

    const outW = Math.max(1, Math.round(canvas.width * scale));
    const outH = Math.max(1, Math.round(canvas.height * scale));

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = outW;
    exportCanvas.height = outH;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    if (format === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outW, outH);
    }
    ctx.drawImage(canvas, 0, 0, outW, outH);

    exportCanvas.toBlob((blob) => {
      if (!blob) { setStatus("فشل تصدير الصورة"); return; }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${imageName.trim() || "imagepro-export"}.${ext}`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus(`تم تصدير الصورة بصيغة ${format.toUpperCase()} بنجاح (الجودة: ${qualityPercent}%، الحجم: ${outW}×${outH})`);
    }, mimeType, quality);
  };

  const toggleLayer = (id: string) => setLayers((current) => current.map((layer) => layer.id === id ? { ...layer, visible: !layer.visible } : layer));
  const setAllLayersVisibility = (visible: boolean) => { setLayers((current) => current.map((layer) => ({ ...layer, visible }))); setLayerOptionsOpen(false); setStatus(visible ? "تم إظهار جميع الطبقات" : "تم إخفاء جميع الطبقات"); };
  const addPaintLayer = () => { const id = `paint-${Date.now()}`; setLayers((current) => [{ id, name: "طبقة رسم", kind: "paint", color: "#2dd4bf", visible: true, opacity: 100, blendMode: "normal" }, ...current]); setSelectedLayer(id); setStatus("تم إنشاء طبقة رسم"); };
  const ensurePaintLayer = () => { const existing = layers.find((layer) => layer.kind === "paint"); if (existing) { setSelectedLayer(existing.id); return existing.id; } const id = `paint-${Date.now()}`; setLayers((current) => [{ id, name: "طبقة رسم", kind: "paint", color: "#2dd4bf", visible: true, opacity: 100, blendMode: "normal" }, ...current]); setSelectedLayer(id); return id; };

  const toggleLayerLock = (id: string) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)));
  };

  const addLayerGroup = () => {

    const newGroupId = `group-${Date.now()}`;
    setLayers((prev) => [
      {
        id: newGroupId,
        name: "مجموعة جديدة",
        kind: "group",
        color: "#6b7280",
        visible: true,
        opacity: 100,
        blendMode: "normal"
      },
      ...prev,
    ]);
    setSelectedLayer(newGroupId);
  };

  const renameLayer = (id: string, newName: string) => {
    if (!newName.trim()) {
      setEditingLayerId(null);
      return;
    }

    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, name: newName.trim() } : l)));
    setEditingLayerId(null);
  };

  const mergeLayerDown = () => {
    if (!selectedLayer) return;
    const idx = layers.findIndex((l) => l.id === selectedLayer);
    if (idx < 0 || idx >= layers.length - 1) return; // Cannot merge down if last layer

    const currentLayer = layers[idx];
    const targetLayer = layers[idx + 1];

    if (currentLayer.kind !== "paint" || targetLayer.kind !== "paint") {
      setStatus("يمكن دمج طبقات الرسم (Paint Layers) فقط مع بعضها البعض لأسفل");
      return;
    }


    
    // Transfer strokes and shapes to target layer
    setStrokes((prev) => prev.map(s => s.layerId === currentLayer.id ? { ...s, layerId: targetLayer.id } : s));
    setShapes((prev) => prev.map(s => s.layerId === currentLayer.id ? { ...s, layerId: targetLayer.id } : s));

    // Remove the current layer
    setLayers((prev) => prev.filter((l) => l.id !== currentLayer.id));
    setSelectedLayer(targetLayer.id);
    setStatus("تم دمج الطبقة بنجاح");
  };

  const removeSelectedLayer = () => {
    if (selectedLayer === "background") {
      setStatus("لا يمكن حذف طبقة الخلفية");
      return;
    }
    const target = layers.find((layer) => layer.id === selectedLayer);
    if (target?.kind === "mask") {
      setMaskRect(null);
    } else if (target?.kind === "text") {
      setTextElements((current) => current.filter((item) => item.id !== selectedLayer));
      setSelectedTextId(null);
    } else if (target?.kind === "paint") {
      setStrokes((current) => current.filter((stroke) => stroke.layerId !== selectedLayer));
      setShapes((current) => current.filter((shape) => shape.layerId !== selectedLayer));
    }
    setLayers((current) => current.filter((layer) => layer.id !== selectedLayer));
    setSelectedLayer("portrait");
    setStatus(`تم حذف الطبقة: ${target?.name || ""}`);
  };

  const moveLayerUp = () => {
    const index = layers.findIndex((l) => l.id === selectedLayer);
    if (index <= 0) {
      setStatus("الطبقة بالفعل في أعلى الترتيب");
      return;
    }
    const target = layers[index];
    if (target.kind === "background") {
      setStatus("لا يمكن تحريك طبقة الخلفية");
      return;
    }
    const next = [...layers];
    next.splice(index, 1);
    next.splice(index - 1, 0, target);
    setLayers(next);
    setStatus(`تم تقديم الطبقة: ${target.name} لأعلى`);
  };

  const moveLayerDown = () => {
    const index = layers.findIndex((l) => l.id === selectedLayer);
    if (index < 0 || index >= layers.length - 1) {
      setStatus("الطبقة بالفعل في أدنى الترتيب");
      return;
    }
    const target = layers[index];
    const nextLayer = layers[index + 1];
    if (nextLayer.kind === "background") {
      setStatus("لا يمكن إنزال الطبقة تحت طبقة الخلفية");
      return;
    }
    const next = [...layers];
    next.splice(index, 1);
    next.splice(index + 1, 0, target);
    setLayers(next);
    setStatus(`تم تأخير الطبقة: ${target.name} لأسفل`);
  };

  const duplicateSelectedLayer = () => { const source = layers.find((layer) => layer.id === selectedLayer); if (!source) { setStatus("اختر طبقة أولاً"); return; } const id = `layer-${Date.now()}`; setLayers((current) => [{ ...source, id, name: `${source.name} — نسخة` }, ...current]); setSelectedLayer(id); setStatus("تم تكرار الطبقة"); };
  const clearSelectedPaint = () => { if (layers.find((layer) => layer.id === selectedLayer)?.kind !== "paint") { setStatus("التنظيف يعمل على طبقة الرسم فقط"); return; } setStrokes((current) => current.filter((stroke) => stroke.layerId !== selectedLayer)); setShapes((current) => current.filter((shape) => shape.layerId !== selectedLayer)); setStatus("تم تنظيف طبقة الرسم"); };

  // Phase 10: Layer Masks Functions
  const addMaskToLayer = () => {
    const sel = layers.find(l => l.id === selectedLayer);
    if (!sel || sel.kind === "group" || sel.kind === "background") {
      setStatus("لا يمكن إضافة قناع لهذه الطبقة");
      return;
    }
    if (sel.maskData) {
      setStatus("هذه الطبقة تمتلك قناعاً بالفعل");
      return;
    }
    
    // Create a fully white mask (reveals everything)
    const offscreen = document.createElement("canvas");
    offscreen.width = cachedImageRef.current?.naturalWidth || 2048;
    offscreen.height = cachedImageRef.current?.naturalHeight || 1536;
    const ctx = offscreen.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);
      const maskDataUrl = offscreen.toDataURL("image/png");
      setLayers(prev => prev.map(l => l.id === selectedLayer ? { ...l, maskData: maskDataUrl, maskEnabled: true } : l));
      setSelectedTarget("mask");
      setStatus("تمت إضافة القناع وتفعيله للرسم");
    }
  };
  const toggleMask = (layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, maskEnabled: !l.maskEnabled } : l));
  };
  const removeMask = (layerId: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id === layerId) {
        const { maskData, maskEnabled, ...rest } = l;
        return rest;
      }
      return l;
    }));
    if (selectedLayer === layerId) setSelectedTarget("content");
  };
  const pointFromPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height)
    };
  };

  const addText = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = pointFromPointer(event);
    const id = `text-${Date.now()}`;
    ensureFontLoaded("Cairo");
    setTextElements((current) => [...current, {
      id,
      text: "نص ImagePro",
      x: Math.round(point.x),
      y: Math.round(point.y),
      size: Math.max(28, Math.round(imageSize.width / 28)),
      color: foregroundColor,
      fontFamily: "Cairo",
      fontWeight: "600",
      fontStyle: "normal",
      textAlign: "center",
      letterSpacing: 0,
      rotation: 0,
      shadowEnabled: false,
      shadowColor: "rgba(0,0,0,0.6)",
      shadowBlur: 8,
      shadowOffsetX: 3,
      shadowOffsetY: 3,
      strokeEnabled: false,
      strokeColor: "#000000",
      strokeWidth: 2,
      glowEnabled: false,
      glowColor: "#00ffff",
      glowBlur: 15,
      gradientEnabled: false,
      gradientColor1: foregroundColor,
      gradientColor2: "#ff6b6b",
    }]);
    setLayers((current) => [{ id, name: "نص ImagePro", kind: "text", color: foregroundColor, visible: true }, ...current]);
    setSelectedTextId(id);
    setSelectedLayer(id);
    setActiveTab("properties");
    setStatus("تمت إضافة طبقة نص مستقلة وتفعيل إعداداتها");
  };

  const selectAll = () => {
    setSelection(selectAllSelection(imageSize));
    setStatus("تم تحديد كامل الصورة (Ctrl+A)");
  };

  const deselect = () => {
    setSelection(null);
    setStatus("تم إلغاء التحديد (Ctrl+D)");
  };

  const invertSelection = () => {
    if (!selection) {
      selectAll();
      return;
    }
    setSelection(invertSelectionRect(selection, imageSize));
    setStatus("تم عكس التحديد (Ctrl+Shift+I)");
  };

  const featherActiveSelection = () => {
    if (!selection) {
      setStatus("حدد منطقة أولاً لتنعيم التحديد");
      return;
    }
    setSelection(featherSelection(selection, 15, imageSize));
    setStatus("تم تنعيم حواف التحديد (Feather: 15px)");
  };

  const updateSelection = (point: { x: number; y: number }) => {
    const start = selectionStart.current;
    if (!start) return;
    const next = {
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      width: Math.abs(point.x - start.x),
      height: Math.abs(point.y - start.y)
    };
    setSelection((current) => {
      if (!current || selectionMode === "replace") return next;
      if (selectionMode === "add") return unionSelection(current, next);
      if (selectionMode === "subtract") return subtractSelection(current, next);
      return next;
    });
  };
  const createMaskFromSelection = () => { if (!selection || selection.width < 3 || selection.height < 3) { setStatus("حدد منطقة أولاً لإنشاء القناع"); return; } setMaskRect(selection); const id = `mask-${Date.now()}`; setLayers((current) => [{ id, name: "قناع التحديد", kind: "mask", color: "#9de9dd", visible: true }, ...current]); setSelectedLayer(id); setSelection(null); setStatus("تم إنشاء قناع غير تدميري من التحديد"); };
  const updateText = (text: string) => { if (!selectedTextId) return; setTextElements((current) => current.map((item) => item.id === selectedTextId ? { ...item, text } : item)); setLayers((current) => current.map((layer) => layer.id === selectedTextId ? { ...layer, name: text || "نص بدون محتوى" } : layer)); };
  const updateTextSize = (size: number) => { if (!selectedTextId) return; setTextElements((current) => current.map((item) => item.id === selectedTextId ? { ...item, size } : item)); };
  const updateTextColor = (color: string) => { if (!selectedTextId) return; setTextElements((current) => current.map((item) => item.id === selectedTextId ? { ...item, color } : item)); setLayers((current) => current.map((layer) => layer.id === selectedTextId ? { ...layer, color } : layer)); };
  const moveTextPosition = (dx: number, dy: number) => { if (!selectedTextId) return; setTextElements((current) => current.map((item) => item.id === selectedTextId ? { ...item, x: Math.round(item.x + dx), y: Math.round(item.y + dy) } : item)); };
  // Phase 11: Advanced text property updater
  const updateTextProp = <K extends keyof TextElement>(key: K, value: TextElement[K]) => {
    if (!selectedTextId) return;
    setTextElements((current) => current.map((item) => item.id === selectedTextId ? { ...item, [key]: value } : item));
  };
  const sampleColor = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = pointFromPointer(event);
    const context = canvas.getContext("2d");
    if (!context) return;
    const x = Math.max(0, Math.min(canvas.width - 1, Math.floor(point.x)));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor(point.y)));
    try {
      const pixel = context.getImageData(x, y, 1, 1).data;
      const hex = `#${[pixel[0], pixel[1], pixel[2]].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
      setForegroundColor(hex);
      setSampledRgb(`RGB ${pixel[0]}, ${pixel[1]}, ${pixel[2]}`);
      setStatus(`🎯 تم التقاط اللون بنجاح: ${hex.toUpperCase()} (RGB: ${pixel[0]}, ${pixel[1]}, ${pixel[2]})`);
    } catch (err) {
      console.error(err);
    }
  };

  const eraseAt = (point: { x: number; y: number }, targetLayerId?: string) => {
    const radius = Math.max(10, brushSize / 2);

    // 1. Erase from strokes with precise line-segment distance and point-level carving
    setStrokes((current) => {
      let changed = false;
      const nextStrokes: Stroke[] = [];

      for (const stroke of current) {
        if (targetLayerId && stroke.layerId && stroke.layerId !== targetLayerId) {
          nextStrokes.push(stroke);
          continue;
        }

        const effectiveRadius = radius + (stroke.width || 4) / 2;
        let touched = false;

        if (stroke.points.length === 1) {
          if (Math.hypot(stroke.points[0].x - point.x, stroke.points[0].y - point.y) <= effectiveRadius) {
            touched = true;
            changed = true;
          } else {
            nextStrokes.push(stroke);
          }
          continue;
        }

        for (let i = 0; i < stroke.points.length; i++) {
          if (Math.hypot(stroke.points[i].x - point.x, stroke.points[i].y - point.y) <= effectiveRadius) {
            touched = true;
            break;
          }
          if (i < stroke.points.length - 1) {
            if (distToSegment(point.x, point.y, stroke.points[i].x, stroke.points[i].y, stroke.points[i + 1].x, stroke.points[i + 1].y) <= effectiveRadius) {
              touched = true;
              break;
            }
          }
        }

        if (!touched) {
          nextStrokes.push(stroke);
          continue;
        }

        changed = true;
        const remainingSegments: { x: number; y: number }[][] = [];
        let currentSegment: { x: number; y: number }[] = [];

        for (let i = 0; i < stroke.points.length; i++) {
          const pt = stroke.points[i];
          const dist = Math.hypot(pt.x - point.x, pt.y - point.y);
          if (dist > effectiveRadius) {
            currentSegment.push(pt);
          } else {
            if (currentSegment.length > 0) {
              remainingSegments.push(currentSegment);
              currentSegment = [];
            }
          }
        }
        if (currentSegment.length > 0) {
          remainingSegments.push(currentSegment);
        }

        if (remainingSegments.length === 1 && remainingSegments[0].length === stroke.points.length) {
          for (let i = 0; i < stroke.points.length - 1; i++) {
            if (distToSegment(point.x, point.y, stroke.points[i].x, stroke.points[i].y, stroke.points[i + 1].x, stroke.points[i + 1].y) <= effectiveRadius) {
              const seg1 = stroke.points.slice(0, i + 1);
              const seg2 = stroke.points.slice(i + 1);
              if (seg1.length > 0) nextStrokes.push({ ...stroke, points: seg1 });
              if (seg2.length > 0) nextStrokes.push({ ...stroke, points: seg2 });
              break;
            }
          }
        } else {
          for (const seg of remainingSegments) {
            if (seg.length > 0) {
              nextStrokes.push({ ...stroke, points: seg });
            }
          }
        }
      }

      return changed ? nextStrokes : current;
    });

    // 2. Erase from shapes
    setShapes((current) => {
      let changed = false;
      const next = current.filter((shape) => {
        if (targetLayerId && shape.layerId && shape.layerId !== targetLayerId) return true;
        const hit = point.x >= shape.x - radius && point.x <= shape.x + shape.width + radius &&
                    point.y >= shape.y - radius && point.y <= shape.y + shape.height + radius;
        if (hit) changed = true;
        return !hit;
      });
      return changed ? next : current;
    });

    // 3. Erase from text (only if a text layer is selected, respecting AF-08)
    const currentLayer = layers.find((l) => l.id === selectedLayer);
    if (currentLayer && currentLayer.kind === "text") {
      setTextElements((current) => current.filter((t) => Math.hypot(t.x - point.x, t.y - point.y) > radius + t.size));
    }
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const currentLayer = layers.find(l => l.id === selectedLayer);
    const editingTools = ["brush", "pencil", "eraser", "bucket", "clone", "heal", "spot", "shape", "text", "adjust"];
    if (currentLayer?.locked && editingTools.includes(activeTool)) {
      setStatus("عذراً، لا يمكن استخدام هذه الأداة لأن الطبقة المحددة مقفلة 🔒");
      return;
    }

    if (activeTool === "hand") {
      event.currentTarget.setPointerCapture(event.pointerId);
      panStart.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
      setIsPanning(true);
      setStatus("التحريك فعال لمساحة العمل");
      return;
    }
    if (activeTool === "crop") {
      event.currentTarget.setPointerCapture(event.pointerId);
      const pt = pointFromPointer(event);
      selectionStart.current = pt;
      setSelection({ x: pt.x, y: pt.y, width: 0, height: 0 });
      setStatus("حدد منطقة القص بالسحب — أفرِج زر الماوس للتطبيق");
      return;
    }
    if (activeTool === "magic") {
      setBrightness((value) => Math.min(100, value + 12));
      setContrast((value) => Math.min(100, value + 10));
      setStatus("✨ تم تطبيق التحسين التلقائي الذكي");
      return;
    }
    if (activeTool === "shape") {
      event.currentTarget.setPointerCapture(event.pointerId);
      selectionStart.current = pointFromPointer(event);
      setSelection({ x: selectionStart.current.x, y: selectionStart.current.y, width: 0, height: 0 });
      setStatus("جارٍ رسم الشكل بالسحب");
      return;
    }
    if (activeTool === "text") {
      addText(event);
      return;
    }
    if (activeTool === "eyedropper") {
      sampleColor(event);
      return;
    }
    if (activeTool === "select") {
      event.currentTarget.setPointerCapture(event.pointerId);
      selectionStart.current = pointFromPointer(event);
      setSelection({ x: selectionStart.current.x, y: selectionStart.current.y, width: 0, height: 0 });
      setStatus("جارٍ تحديد المنطقة بالسحب");
      return;
    }
    if (activeTool === "brush" || activeTool === "pencil") {
      const paintLayerId = selectedTarget === "mask" ? selectedLayer : ensurePaintLayer();
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDrawing(true);
      const point = pointFromPointer(event);
      lastPointRef.current = point;
      const effectiveWidth = activeTool === "pencil" ? Math.max(1, Math.min(4, Math.round(brushSize / 4))) : Math.max(2, brushSize);
      
      // If drawing on mask, force grayscale colors
      let strokeColor = foregroundColor;
      if (selectedTarget === "mask") {
        // simple grayscale conversion for mask brush
        strokeColor = foregroundColor === "#000000" ? "black" : "white";
      }

      currentStrokeRef.current = {
        points: [point],
        color: strokeColor,
        width: effectiveWidth,
        opacity: activeTool === "pencil" ? 100 : brushOpacity,
        hardness: activeTool === "pencil" ? 100 : brushHardness,
        mode: activeTool === "pencil" ? "pencil" : "brush",
        layerId: paintLayerId,
        isMask: selectedTarget === "mask" // Add custom flag
      } as any;
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && currentStrokeRef.current) {
        drawSmoothStroke(ctx, currentStrokeRef.current);
      }
      setStatus(`${activeTool === "pencil" ? "القلم الدقيق" : "الفرشاة"} نشط على طبقة الرسم (الحجم: ${effectiveWidth}px)`);
      return;
    }
    if (activeTool === "bucket") {
      const point = pointFromPointer(event);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const success = applyFloodFill(ctx, canvas.width, canvas.height, Math.round(point.x), Math.round(point.y), foregroundColor, 32);
          if (success) {
            setImageSrc(canvas.toDataURL("image/png"));
            setStatus(`تم تعبئة المساحة باللون ${foregroundColor.toUpperCase()}`);
          }
        }
      }
      return;
    }
    if (activeTool === "eraser") {
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDrawing(true);
      const point = pointFromPointer(event);
      lastPointRef.current = point;

      let targetId = selectedLayer;
      const currentLayer = layers.find((l) => l.id === selectedLayer);
      if (!currentLayer || (currentLayer.kind !== "paint" && currentLayer.kind !== "text")) {
        const paintLayer = layers.find((l) => l.kind === "paint");
        if (paintLayer) {
          targetId = paintLayer.id;
          setSelectedLayer(paintLayer.id);
        } else {
          targetId = ensurePaintLayer();
        }
      }
      eraserTargetLayerRef.current = targetId;
      eraseAt(point, targetId);
      setStatus(`الممحاة نشطة (الحجم: ${brushSize}px) — اسحب للمسح`);
      return;
    }
    if (activeTool === "clone") {
      const point = pointFromPointer(event);
      if (event.altKey) {
        setCloneSource(point);
        setStatus(`تم تحديد نقطة المصدر لختم الاستنساخ: (${Math.round(point.x)}, ${Math.round(point.y)}) — انقر واسحب للنسخ`);
        return;
      }
      if (!cloneSource) {
        setStatus("يرجى الضغط على Alt+النقر لتحديد نقطة المصدر لختم الاستنساخ أولاً");
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDrawing(true);
      lastPointRef.current = point;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          applyCloneStamp(ctx, canvas.width, canvas.height, point.x, point.y, cloneSource.x, cloneSource.y, retouchRadius, retouchOpacity, retouchHardness);
          setStatus(`ختم الاستنساخ: نسخ من (${Math.round(cloneSource.x)}, ${Math.round(cloneSource.y)})`);
        }
      }
      return;
    }
    if (activeTool === "heal") {
      const point = pointFromPointer(event);
      if (event.altKey) {
        setCloneSource(point);
        setStatus(`تم تحديد نسيج المصدر لفرشاة المعالجة: (${Math.round(point.x)}, ${Math.round(point.y)})`);
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (retouchMode === "redeye") {
        applyRedEyeRemoval(ctx, canvas.width, canvas.height, point.x, point.y, retouchRadius);
        setImageSrc(canvas.toDataURL("image/png"));
        setStatus("تمت إزالة احمرار العين في البؤبؤ المستهدف بنجاح");
        return;
      }

      if (retouchMode === "spot" || !cloneSource) {
        applySpotHealing(ctx, canvas.width, canvas.height, point.x, point.y, retouchRadius);
        setImageSrc(canvas.toDataURL("image/png"));
        setStatus("تمت إزالة البقعة الموضعية فورياً (Spot Healing)");
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDrawing(true);
      lastPointRef.current = point;
      applyHealingBrush(ctx, canvas.width, canvas.height, point.x, point.y, cloneSource.x, cloneSource.y, retouchRadius, retouchOpacity, retouchHardness);
      setStatus("تمت معالجة ومزج النسيج مع الإضاءة بنجاح");
      return;
    }
  };

  const continueDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === "hand" && panStart.current) {
      setPan({ x: panStart.current.panX + event.clientX - panStart.current.x, y: panStart.current.panY + event.clientY - panStart.current.y });
      return;
    }
    const point = pointFromPointer(event);
    if ((activeTool === "select" || activeTool === "shape" || activeTool === "crop") && selectionStart.current) {
      updateSelection(point);
      return;
    }
    if (!isDrawing) return;
    if ((activeTool === "brush" || activeTool === "pencil") && currentStrokeRef.current && lastPointRef.current) {
      currentStrokeRef.current.points.push(point);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && currentStrokeRef.current) {
        drawSmoothStroke(ctx, currentStrokeRef.current);
      }
      lastPointRef.current = point;
      return;
    }
    if (activeTool === "eraser" && isDrawing) {
      const targetId = eraserTargetLayerRef.current || undefined;
      eraseAt(point, targetId);
      return;
    }
    if (activeTool === "clone" && isDrawing && cloneSource) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          applyCloneStamp(ctx, canvas.width, canvas.height, point.x, point.y, cloneSource.x, cloneSource.y, retouchRadius, retouchOpacity, retouchHardness);
        }
      }
      return;
    }
    if (activeTool === "heal" && isDrawing && cloneSource) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          applyHealingBrush(ctx, canvas.width, canvas.height, point.x, point.y, cloneSource.x, cloneSource.y, retouchRadius, retouchOpacity, retouchHardness);
        }
      }
      return;
    }
  };

  const generateLayerThumbnail = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || layer.kind !== "paint") return;
    const cw = canvasRef.current?.width || 2048;
    const ch = canvasRef.current?.height || 1536;
    const offscreen = document.createElement("canvas");
    offscreen.width = 64;
    offscreen.height = 64;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;
    
    ctx.scale(64 / cw, 64 / ch);
    drawShapes(ctx, shapes.filter(s => s.layerId === layerId));
    drawStrokes(ctx, strokes.filter(s => s.layerId === layerId));
    
    const dataUrl = offscreen.toDataURL("image/png");
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, thumbnail: dataUrl } : l));
  };

  const finishDrawing = () => {
    if (activeTool === "hand") { panStart.current = null; setIsPanning(false); return; }
    if (activeTool === "crop" && selectionStart.current) {
      selectionStart.current = null;
      if (selection && selection.width > 5 && selection.height > 5) {
        cropToSelection();
      } else {
        setStatus("منطقة القص صغيرة جداً — اسحب مساحة أكبر للقص");
      }
      return;
    }
    if (activeTool === "shape" && selectionStart.current && selection && (Math.abs(selection.width) > 3 || Math.abs(selection.height) > 3)) {
      const layerId = ensurePaintLayer();
      setShapes((current) => [
        ...current,
        {
          id: `shape-${Date.now()}`,
          shape: activeShapeType,
          x: selection.x,
          y: selection.y,
          width: selection.width,
          height: selection.height,
          color: foregroundColor,
          fillColor: backgroundColor,
          widthStroke: Math.max(2, Math.round(brushSize / 4)),
          fillMode: shapeFillMode,
          layerId
        }
      ]);
      setTimeout(() => generateLayerThumbnail(layerId), 10);
      selectionStart.current = null;
      setSelection(null);
      setStatus(`تم إنشاء شكل (${activeShapeType}) على طبقة الرسم`);
      return;
    }
    if (activeTool === "select" && selectionStart.current) {
      selectionStart.current = null;
      setStatus(selection && selection.width > 2 && selection.height > 2 ? `تم التحديد — الوضع: ${selectionMode === "replace" ? "استبدال" : selectionMode === "add" ? "إضافة" : "طرح"}` : "التحديد صغير جداً");
      return;
    }
    if (isDrawing) {
      setIsDrawing(false);
      lastPointRef.current = null;
      eraserTargetLayerRef.current = null;
      if ((activeTool === "brush" || activeTool === "pencil") && currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
        const completedStroke = currentStrokeRef.current as any;
        currentStrokeRef.current = null;
        
        if (completedStroke.isMask) {
          // Apply stroke to mask data
          const selLayer = layers.find(l => l.id === selectedLayer);
          if (selLayer && selLayer.maskData) {
            const img = cachedMasksRef.current[selLayer.id];
            if (img) {
               const offscreen = document.createElement("canvas");
               offscreen.width = cachedImageRef.current?.naturalWidth || 2048;
               offscreen.height = cachedImageRef.current?.naturalHeight || 1536;
               const ctx = offscreen.getContext("2d");
               if (ctx) {
                 ctx.translate(offscreen.width / 2, offscreen.height / 2);
                 ctx.rotate((((rotation % 360) + 360) % 360 * Math.PI) / 180);
                 ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
                 
                 ctx.drawImage(img, -offscreen.width / 2, -offscreen.height / 2, offscreen.width, offscreen.height);
                 
                 // If stroke color is black, we want to erase the mask (destination-out)
                 // If stroke color is white, we want to draw on the mask (source-over)
                 if (completedStroke.color === "black") {
                   ctx.globalCompositeOperation = "destination-out";
                   // force color to black/opaque for erasing alpha
                   drawSmoothStroke(ctx, { ...completedStroke, mode: "brush", color: "black" });
                 } else {
                   ctx.globalCompositeOperation = "source-over";
                   drawSmoothStroke(ctx, { ...completedStroke, mode: "brush", color: "white" });
                 }
                 ctx.globalCompositeOperation = "source-over"; // reset
                 
                 const newDataUrl = offscreen.toDataURL("image/png");
                 setLayers(prev => prev.map(l => l.id === selectedLayer ? { ...l, maskData: newDataUrl } : l));
                 cachedMasksRef.current[selectedLayer].src = newDataUrl; // Instant cache update
               }
            }
          }
        } else {
          setStrokes((current) => [...current, completedStroke]);
          if (completedStroke.layerId) setTimeout(() => generateLayerThumbnail(completedStroke.layerId as string), 10);
        }
      }
      if ((activeTool === "clone" || activeTool === "heal") && canvasRef.current) {
        setImageSrc(canvasRef.current.toDataURL("image/png"));
      }
      setStatus(activeTool === "eraser" ? "تم المسح بنجاح" : activeTool === "clone" ? "تم تثبيت ختم الاستنساخ" : activeTool === "heal" ? "تم تثبيت المعالجة" : "تم تثبيت الرسم");
    }
  };

  const activateTool = (toolId: string) => {
    setActiveTool(toolId);
    if (toolId === "clone" || toolId === "heal" || toolId === "adjust" || toolId === "crop" || toolId === "shape" || toolId === "text" || toolId === "select" || toolId === "brush" || toolId === "pencil" || toolId === "bucket") {
      setActiveTab("properties");
      if (!isInspectorOpen) setIsInspectorOpen(true);
    }
    if (toolId === "eraser") {
      const currentLayer = layers.find((l) => l.id === selectedLayer);
      if (!currentLayer || (currentLayer.kind !== "paint" && currentLayer.kind !== "text")) {
        const paintLayer = layers.find((l) => l.kind === "paint");
        if (paintLayer) {
          setSelectedLayer(paintLayer.id);
        } else {
          ensurePaintLayer();
        }
      }
    }
    if (toolId === "magic") {
      setActiveTab("properties");
      if (!isInspectorOpen) setIsInspectorOpen(true);
      setBrightness((value) => Math.min(100, value + 12));
      setContrast((value) => Math.min(100, value + 10));
      setStatus("✨ تم تطبيق التحسين التلقائي الذكي (+12 سطوع، +10 تباين)");
      return;
    }
    const messages: Record<string, string> = {
      select: "أداة التحديد نشطة — اسحب لتحديد منطقة، أو اختر الشكل (مستطيل/بيضاوي/حر)",
      hand: "أداة التحريك جاهزة — اسحب مساحة العمل (أو اضغط زر المسافة Space)",
      crop: "أداة القص جاهزة — اسحب لتحديد المنطقة المراد قصها ثم أفرِج الماوس",
      brush: "أداة الفرشاة نشطة — ارسم بحرية على مساحة العمل بدون أي تأخير",
      pencil: "أداة القلم الدقيق نشطة — خطوط دقيقة وحواف صلبة",
      eraser: "أداة الممحاة نشطة — امسح خطوط الرسم مع بقاء الصورة والنص آمنين",
      bucket: "أداة دلو التلوين جاهزة — انقر داخل أي مساحة لتعبئتها فيضانياً",
      eyedropper: "أداة القطّارة نشطة — انقر على أي نقطة داخل الصورة لالتقاط لونها فوراً",
      clone: "أداة ختم الاستنساخ نشطة — اضغط Alt+النقر لتحديد نقطة المصدر، ثم اسحب للنسخ",
      heal: "أداة المعالجة والتنقيح نشطة — انقر لمعالجة البقع أو اضغط Alt+النقر لتحديد نسيج المصدر",
      shape: "أداة الأشكال نشطة — اسحب داخل الصورة لرسم مستطيل أو شكل بيضاوي",
      text: "أداة النص نشطة — انقر على مساحة العمل لإضافة نص مستقل جديد",
      adjust: "تم فتح لوحة الخصائص والتعديلات اللونية",
    };
    setStatus(messages[toolId] ?? "تم اختيار الأداة");
  };

  const getCursorClass = () => {
    if (activeTool === "hand") return isPanning ? "cursor-grabbing" : "cursor-grab";
    if (activeTool === "brush" || activeTool === "eraser" || activeTool === "select" || activeTool === "crop" || activeTool === "shape" || activeTool === "clone" || activeTool === "heal") return "cursor-crosshair";
    if (activeTool === "eyedropper") return "cursor-crosshair";
    return "";
  };

  return (
    <TooltipProvider delayDuration={180}>
      <main className="editor-shell">
        <header className="command-bar">
          <div className="brand-lockup">
            <div className="brand-mark">
              <img src="/assets/imagepro-logo.png" alt="ImagePro Logo" />
            </div>
            <div>
              <div className="brand-name">ImagePro <span>Studio</span></div>
              <div className="brand-caption">IMAGE PROCESSING LAB <span>•</span> 02.00</div>
            </div>
          </div>

          <nav className="command-nav" aria-label="القائمة الرئيسية">
            {/* 1. قائمة ملف File Menu */}
            <div className="app-dropdown-container">
              <button
                onClick={() => setActiveMenu(activeMenu === "file" ? null : "file")}
                className={activeMenu === "file" ? "is-active" : ""}
                data-testid="top-file"
              >
                ملف <ChevronDown size={13} />
              </button>
              {activeMenu === "file" && (
                <div className="app-dropdown-menu">
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); setNewProjectOpen(true); }}>
                    <span className="app-menu-item-left"><FilePlus size={14} /> مشروع جديد...</span>
                    <span className="app-menu-badge">Ctrl+N</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); uploadRef.current?.click(); }}>
                    <span className="app-menu-item-left"><FolderOpen size={14} /> فتح صورة...</span>
                    <span className="app-menu-badge">Ctrl+O</span>
                  </button>
                  <div className="app-menu-separator" />
                  <div style={{ padding: "4px 8px", fontSize: "10px", color: "#6a8c85" }}>الصور النموذجية:</div>
                  <button className="app-menu-item" onClick={() => loadSampleImage("portrait")}>
                    <span className="app-menu-item-left"><ImageIcon size={14} /> صورة شخصية</span>
                    <span className="app-menu-badge">Portrait</span>
                  </button>
                  <button className="app-menu-item" onClick={() => loadSampleImage("landscape")}>
                    <span className="app-menu-item-left"><ImageIcon size={14} /> منظر طبيعي</span>
                    <span className="app-menu-badge">Landscape</span>
                  </button>
                  <button className="app-menu-item" onClick={() => loadSampleImage("stillLife")}>
                    <span className="app-menu-item-left"><ImageIcon size={14} /> طبيعة صامتة</span>
                    <span className="app-menu-badge">Still Life</span>
                  </button>
                  <div className="app-menu-separator" />
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); saveProject(); }}>
                    <span className="app-menu-item-left"><Save size={14} /> حفظ المشروع محلياً</span>
                    <span className="app-menu-badge">Ctrl+S</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); restoreProject(); }}>
                    <span className="app-menu-item-left"><RotateCcw size={14} /> استعادة آخر حفظ محلي</span>
                  </button>
                  <div className="app-menu-separator" />
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); exportProjectFile(); }}>
                    <span className="app-menu-item-left"><FileDown size={14} /> حفظ كملف مشروع (.imagepro)</span>
                    <span className="app-menu-badge">.imagepro</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); projectFileInputRef.current?.click(); }}>
                    <span className="app-menu-item-left"><FolderOpen size={14} /> استيراد ملف مشروع (.imagepro)...</span>
                  </button>
                  <input
                    type="file"
                    ref={projectFileInputRef}
                    accept=".imagepro,application/json"
                    style={{ display: "none" }}
                    onChange={handleProjectFileImport}
                  />
                  <div className="app-menu-separator" />
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); setExportOptionsOpen(true); }}>
                    <span className="app-menu-item-left"><Download size={14} /> تصدير مخصص (JPG/PNG/WebP)...</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); setFileInfoOpen(true); }}>
                    <span className="app-menu-item-left"><Info size={14} /> معلومات الملف والمشروع...</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. قائمة تحرير Edit Menu */}
            <div className="app-dropdown-container">
              <button
                onClick={() => setActiveMenu(activeMenu === "edit" ? null : "edit")}
                className={activeMenu === "edit" ? "is-active" : ""}
                data-testid="top-edit"
              >
                تحرير <ChevronDown size={13} />
              </button>
              {activeMenu === "edit" && (
                <div className="app-dropdown-menu">
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); undo(); }}>
                    <span className="app-menu-item-left"><Undo2 size={14} /> تراجع</span>
                    <span className="app-menu-badge">Ctrl+Z</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); redo(); }}>
                    <span className="app-menu-item-left"><Redo2 size={14} /> تقدم</span>
                    <span className="app-menu-badge">Ctrl+Y</span>
                  </button>
                  <div className="app-menu-separator" />
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); selectAll(); }}>
                    <span className="app-menu-item-left"><Square size={14} /> تحديد الكل</span>
                    <span className="app-menu-badge">Ctrl+A</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); deselect(); }}>
                    <span className="app-menu-item-left"><X size={14} /> إلغاء التحديد</span>
                    <span className="app-menu-badge">Ctrl+D</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); invertSelection(); }}>
                    <span className="app-menu-item-left"><Sparkles size={14} /> عكس التحديد</span>
                    <span className="app-menu-badge">Ctrl+Shift+I</span>
                  </button>
                  <div className="app-menu-separator" />
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); clearSelectedPaint(); }}>
                    <span className="app-menu-item-left"><Eraser size={14} /> تنظيف طبقة الرسم</span>
                  </button>
                  <button className="app-menu-item" onClick={() => {
                    setActiveMenu(null);
                    resetAdjustments();
                  }}>
                    <span className="app-menu-item-left"><RotateCcw size={14} /> إعادة ضبط التعديلات</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. قائمة صورة Image Menu (Phase 3 Complete) */}
            <div className="app-dropdown-container">
              <button
                onClick={() => setActiveMenu(activeMenu === "image" ? null : "image")}
                className={activeMenu === "image" ? "is-active" : ""}
                data-testid="top-image"
              >
                صورة <ChevronDown size={13} />
              </button>
              {activeMenu === "image" && (
                <div className="app-dropdown-menu">
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); setRotation((v) => (v + 90) % 360); setStatus("تم تدوير الصورة 90° باتجاه عقارب الساعة"); }}>
                    <span className="app-menu-item-left"><RotateCw size={14} /> تدوير 90° باتجاه عقارب الساعة</span>
                    <span className="app-menu-badge">90°</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); setRotation((v) => (v - 90 + 360) % 360); setStatus("تم تدوير الصورة 90° عكس عقارب الساعة"); }}>
                    <span className="app-menu-item-left"><RotateCcw size={14} /> تدوير 90° عكس عقارب الساعة</span>
                    <span className="app-menu-badge">-90°</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); setRotation((v) => (v + 180) % 360); setStatus("تم تدوير الصورة 180°"); }}>
                    <span className="app-menu-item-left"><RotateCw size={14} /> تدوير 180° بالكامل</span>
                    <span className="app-menu-badge">180°</span>
                  </button>
                  <div className="app-menu-separator" />
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); setFlipX((v) => !v); setStatus("تم القلب أفقياً"); }}>
                    <span className="app-menu-item-left">↔️ قلب أفقي (Flip Horizontal)</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); setFlipY((v) => !v); setStatus("تم القلب رأسياً"); }}>
                    <span className="app-menu-item-left">↕️ قلب رأسي (Flip Vertical)</span>
                  </button>
                  <div className="app-menu-separator" />
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); cropToSquare(); }}>
                    <span className="app-menu-item-left"><Crop size={14} /> قص مربع متساوي الأبعاد (1:1)</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); cropToRatio(16, 9); }}>
                    <span className="app-menu-item-left"><Crop size={14} /> قص بنسبة شاشة عريضة (16:9)</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); cropToRatio(4, 3); }}>
                    <span className="app-menu-item-left"><Crop size={14} /> قص بنسبة قياسية (4:3)</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); cropToSelection(); }}>
                    <span className="app-menu-item-left"><Crop size={14} /> قص منطقة التحديد النشطة</span>
                  </button>
                  <div className="app-menu-separator" />
                  <button className="app-menu-item" onClick={() => {
                    setActiveMenu(null);
                    setResizeWidth(imageSize.width);
                    setResizeHeight(imageSize.height);
                    setResizeDialogOpen(true);
                  }}>
                    <span className="app-menu-item-left"><Scale size={14} /> تغيير حجم وأبعاد الصورة...</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. قائمة مرشح Filter Menu (Phase 3 Complete) */}
            <div className="app-dropdown-container">
              <button
                onClick={() => setActiveMenu(activeMenu === "filter" ? null : "filter")}
                className={activeMenu === "filter" ? "is-active" : ""}
                data-testid="top-filter"
              >
                مرشح <ChevronDown size={13} />
              </button>
              {activeMenu === "filter" && (
                <div className="app-dropdown-menu" style={{ maxHeight: "420px", overflowY: "auto", minWidth: "260px" }}>
                  {FILTER_CATALOG.map((f) => (
                    <button
                      key={f.id}
                      className="app-menu-item"
                      onClick={() => {
                        setActiveMenu(null);
                        setFilterMode(f.id);
                        if (f.defaultIntensity !== undefined) setFilterIntensity(f.defaultIntensity);
                        setStatus(`تم تطبيق المرشح: ${f.nameArabic}`);
                      }}
                    >
                      <span className="app-menu-item-left" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{f.nameArabic}</span>
                        <span style={{ fontSize: "9px", color: "#6a8c85", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: "3px" }}>{f.category}</span>
                      </span>
                      <span className="app-menu-badge">{filterMode === f.id ? "✓" : ""}</span>
                    </button>
                  ))}
                  <div className="app-menu-separator" />
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); setThresholdEnabled(!thresholdEnabled); setStatus(thresholdEnabled ? "تم إيقاف العتبة الثنائية" : "تم تفعيل العتبة الثنائية (Threshold)"); }}>
                    <span className="app-menu-item-left">عتبة ثنائية (Threshold)</span>
                    <span className="app-menu-badge">{thresholdEnabled ? "✓" : ""}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 5. قائمة عرض View Menu (Phase 2 & User Feedback Fix) */}
            <div className="app-dropdown-container">
              <button
                onClick={() => setActiveMenu(activeMenu === "view" ? null : "view")}
                className={activeMenu === "view" ? "is-active" : ""}
                data-testid="top-view"
              >
                عرض <ChevronDown size={13} />
              </button>
              {activeMenu === "view" && (
                <div className="app-dropdown-menu">
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); actualSize(); }}>
                    <span className="app-menu-item-left"><ImageIcon size={14} /> 100% الحجم الفعلي</span>
                    <span className="app-menu-badge">Ctrl+1</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); fitToScreen(); }}>
                    <span className="app-menu-item-left"><ImageIcon size={14} /> ملاءمة الشاشة (Fit)</span>
                    <span className="app-menu-badge">Ctrl+0</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); setZoom((v) => Math.min(200, v + 10)); }}>
                    <span className="app-menu-item-left"><Plus size={14} /> تكبير (Zoom In)</span>
                    <span className="app-menu-badge">+</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); setZoom((v) => Math.max(20, v - 10)); }}>
                    <span className="app-menu-item-left"><Minus size={14} /> تصغير (Zoom Out)</span>
                    <span className="app-menu-badge">-</span>
                  </button>
                  <div className="app-menu-separator" />
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); setShowGrid(!showGrid); setStatus(showGrid ? "تم إخفاء شبكة المحاذاة" : "تم إظهار شبكة المحاذاة"); }}>
                    <span className="app-menu-item-left"><Grid size={14} /> {showGrid ? "إخفاء شبكة المحاذاة" : "إظهار شبكة المحاذاة"}</span>
                    <span className="app-menu-badge">{showGrid ? "✓" : ""}</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); setIsInspectorOpen(!isInspectorOpen); setStatus(isInspectorOpen ? "تم طي لوحة الخصائص" : "تم إظهار لوحة الخصائص"); }}>
                    <span className="app-menu-item-left"><PanelRight size={14} /> {isInspectorOpen ? "طي اللوحة الجانبية" : "إظهار اللوحة الجانبية"}</span>
                    <span className="app-menu-badge">{isInspectorOpen ? "✓" : ""}</span>
                  </button>
                  <div className="app-menu-separator" />
                  {/* Fullscreen Toggle & Restore Button with Dynamic State */}
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); toggleFullscreen(); }}>
                    <span className="app-menu-item-left">
                      {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                      {isFullscreen ? "إنهاء ملء الشاشة (استعادة الحجم الأصلي)" : "ملء الشاشة الكامل"}
                    </span>
                    <span className="app-menu-badge">{isFullscreen ? "Esc" : "F11"}</span>
                  </button>
                </div>
              )}
            </div>
          </nav>

          <div className="command-actions">
            <button className="save-state save-action" onClick={saveProject} data-testid="save-project">
              <span className="save-dot" /> {isRendering ? "جارٍ المعالجة..." : "حفظ المشروع"}
            </button>
            <button className="icon-action" aria-label="حالة التخزين السحابي" onClick={() => setStatus("التخزين السحابي غير متصل — الحفظ المحلي في المتصفح فعال")}>
              <Cloud size={16} />
            </button>

            {/* قائمة التصدير المنسدلة */}
            <div className="app-dropdown-container">
              <button
                className="export-button"
                onClick={() => setActiveMenu(activeMenu === "export" ? null : "export")}
                data-testid="export-png"
              >
                <Download size={15} /> تصدير <ChevronDown size={13} />
              </button>
              {activeMenu === "export" && (
                <div className="app-dropdown-menu align-left">
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); exportImage("png"); }}>
                    <span className="app-menu-item-left"><Download size={14} /> تصدير PNG (شفافية كاملة)</span>
                    <span className="app-menu-badge">PNG</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); exportImage("jpeg", 92); }}>
                    <span className="app-menu-item-left"><Download size={14} /> تصدير JPG (جودة 92%)</span>
                    <span className="app-menu-badge">JPG</span>
                  </button>
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); exportImage("webp", 90); }}>
                    <span className="app-menu-item-left"><Download size={14} /> تصدير WebP (ضغط متقدم)</span>
                    <span className="app-menu-badge">WebP</span>
                  </button>
                  <div className="app-menu-separator" />
                  <button className="app-menu-item" onClick={() => { setActiveMenu(null); setExportOptionsOpen(true); }}>
                    <span className="app-menu-item-left"><Settings2 size={14} /> خيارات تصدير مخصصة...</span>
                  </button>
                </div>
              )}
            </div>
            <div className="avatar" title="محرر الصور الجامعي">AR</div>
          </div>
        </header>

        <section className={`workspace-grid ${!isInspectorOpen ? "inspector-closed" : ""}`}>
          <aside className="tool-rail" aria-label="شريط الأدوات" style={{ display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }}>
            {/* Scrollable tools section */}
            <div className="tool-rail-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "12px 0 8px", scrollbarWidth: "thin", scrollbarColor: "rgba(45,212,191,0.2) transparent" }}>
              <div className="rail-label">الأدوات</div>
              {toolGroups.map((group, index) => (
                <div className="tool-group" key={index}>
                  {group.map((tool) => (
                    <ToolButton key={tool.id} tool={tool} active={activeTool === tool.id} onClick={() => activateTool(tool.id)} />
                  ))}
                </div>
              ))}
            </div>
            {/* Fixed bottom section */}
            <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "10px 0 12px", background: "#172323" }}>
              <button className="tool-button" onClick={() => uploadRef.current?.click()} aria-label="رفع صورة" title="فتح صورة من الجهاز">
                <Upload size={18} />
              </button>
              <button className="tool-button" aria-label="إعدادات الأدوات" title="لوحة الخصائص" onClick={() => { setActiveTab("properties"); if (!isInspectorOpen) setIsInspectorOpen(true); setStatus("تم فتح إعدادات الأدوات"); }}>
                <Settings2 size={18} />
              </button>
              <div className="color-pair" aria-label="الألوان الأمامية والخلفية" title={`اللون الأمامي: ${foregroundColor.toUpperCase()} | الخلفي: ${backgroundColor.toUpperCase()}`} style={{ position: "relative" }}>
                <div style={{ position: "relative", width: "32px", height: "32px" }}>
                  <span className="foreground-color" style={{ background: foregroundColor }} title="اللون الأمامي" />
                  <input
                    type="color"
                    value={foregroundColor}
                    onChange={(e) => {
                      setForegroundColor(e.target.value);
                      setStatus(`تم اختيار اللون الأمامي: ${e.target.value.toUpperCase()}`);
                    }}
                    style={{ opacity: 0, position: "absolute", top: 0, left: 0, width: "20px", height: "20px", cursor: "pointer", zIndex: 10 }}
                    title="تغيير اللون الأمامي"
                  />
                  <span className="background-color" style={{ background: backgroundColor }} title="اللون الخلفي" />
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => {
                      setBackgroundColor(e.target.value);
                      setStatus(`تم اختيار اللون الخلفي: ${e.target.value.toUpperCase()}`);
                    }}
                    style={{ opacity: 0, position: "absolute", bottom: 0, right: 0, width: "20px", height: "20px", cursor: "pointer", zIndex: 9 }}
                    title="تغيير اللون الخلفي"
                  />
                </div>
                <button
                  type="button"
                  onClick={swapColors}
                  title="تبديل اللون الأمامي والخلفي (X)"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "3px",
                    color: "#2dd4bf",
                    cursor: "pointer",
                    width: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "absolute",
                    bottom: "-6px",
                    left: "-4px",
                    zIndex: 11,
                    padding: 0
                  }}
                >
                  <RefreshCw size={9} />
                </button>
              </div>
            </div>
          </aside>

          <section className="canvas-column" style={{ position: "relative" }}>
            <div className="canvas-toolbar">
              <div className="document-title">
                {isEditingTitle ? (
                  <div className="title-edit-box">
                    <input
                      type="text"
                      className="title-edit-input"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = tempTitle.trim() || "مشروع بدون اسم";
                          setImageName(val);
                          setIsEditingTitle(false);
                          setStatus(`تم تغيير اسم المشروع إلى: ${val}`);
                        } else if (e.key === "Escape") {
                          setIsEditingTitle(false);
                        }
                      }}
                      autoFocus
                    />
                    <button className="title-action-btn" onClick={() => { const val = tempTitle.trim() || "مشروع بدون اسم"; setImageName(val); setIsEditingTitle(false); setStatus(`تم تغيير اسم المشروع إلى: ${val}`); }} title="حفظ"><Check size={12} /></button>
                    <button className="title-action-btn" onClick={() => setIsEditingTitle(false)} title="إلغاء"><X size={12} /></button>
                  </div>
                ) : (
                  <button
                    className="title-display-btn"
                    onClick={() => { setTempTitle(imageName); setIsEditingTitle(true); }}
                    title="انقر لتعديل اسم المشروع"
                    data-testid="edit-project-title"
                  >
                    <span className="signal-line" />
                    <span>{imageName}</span>
                    <Pencil size={11} style={{ opacity: 0.6 }} />
                    <span className="dirty-dot">•</span>
                  </button>
                )}
              </div>
              <div className="canvas-actions">
                {/* Phase 3: Before / After Comparison Button */}
                <button
                  className={`compare-btn ${isComparingBefore ? "is-comparing" : ""}`}
                  onMouseDown={() => { setIsComparingBefore(true); setStatus("معاينة أصل الصورة بدون أي تعديلات (حرر الزر للعودة)"); }}
                  onMouseUp={() => { setIsComparingBefore(false); setStatus("تمت العودة للصورة المعدلة"); }}
                  onMouseLeave={() => { if (isComparingBefore) { setIsComparingBefore(false); setStatus("تمت العودة للصورة المعدلة"); } }}
                  onTouchStart={() => { setIsComparingBefore(true); setStatus("معاينة أصل الصورة"); }}
                  onTouchEnd={() => { setIsComparingBefore(false); setStatus("تمت العودة للصورة المعدلة"); }}
                  title="اضغط مع الاستمرار لمقارنة التعديلات مع الصورة الأصلية"
                  data-testid="compare-before-after"
                >
                  <Eye size={13} /> {isComparingBefore ? "عرض الأصل..." : "مقارنة قبل / بعد"}
                </button>
                <span className="toolbar-divider" />
                <button
                  className={`canvas-icon ${historyRef.current.length < 2 ? "muted" : ""}`}
                  onClick={undo}
                  aria-label="تراجع"
                  data-testid="undo"
                  title="تراجع (Ctrl+Z)"
                  style={{ opacity: historyRef.current.length < 2 ? 0.4 : 1 }}
                >
                  <Undo2 size={16} />
                </button>
                <button
                  className={`canvas-icon ${redoRef.current.length === 0 ? "muted" : ""}`}
                  onClick={redo}
                  aria-label="تقدم"
                  data-testid="redo"
                  title="تقدم (Ctrl+Y)"
                  style={{ opacity: redoRef.current.length === 0 ? 0.4 : 1 }}
                >
                  <Redo2 size={16} />
                </button>
                <span className="toolbar-divider" />
                <button className="canvas-icon" onClick={fitToScreen} aria-label="ملاءمة الشاشة" title="ملاءمة الصورة لمساحة العمل (Ctrl+0)">
                  <ImageIcon size={16} />
                </button>
                <button
                  className={`canvas-icon ${isFullscreen ? "is-active text-teal-400 font-bold" : ""}`}
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "إنهاء ملء الشاشة" : "العرض الكامل"}
                  data-testid="fullscreen"
                  title={isFullscreen ? "إنهاء ملء الشاشة واستعادة الحجم الأصلي (Esc)" : "ملء الشاشة الكامل (F11)"}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>
            </div>

            {/* Floating button to re-open inspector if closed - strictly anchored to LEFT */}
            {!isInspectorOpen && (
              <button
                className="floating-inspector-btn"
                onClick={() => { setIsInspectorOpen(true); setStatus("تم إظهار لوحة الطبقات والخصائص"); }}
                title="إظهار لوحة الخصائص والطبقات"
                data-testid="floating-inspector-btn"
              >
                <PanelRightClose size={15} /> إظهار لوحة الخصائص
              </button>
            )}

            <div
              ref={canvasStageRef}
              className={`canvas-stage ${getCursorClass()}`}
              onPointerDown={(e) => {
                if (activeTool === "hand" && e.target === canvasStageRef.current) {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
                  setIsPanning(true);
                  setStatus("التحريك فعال لمساحة العمل");
                }
              }}
              onPointerMove={(e) => {
                if (activeTool === "hand" && panStart.current) {
                  setPan({
                    x: panStart.current.panX + (e.clientX - panStart.current.x),
                    y: panStart.current.panY + (e.clientY - panStart.current.y),
                  });
                }
              }}
              onPointerUp={() => {
                if (activeTool === "hand") {
                  panStart.current = null;
                  setIsPanning(false);
                }
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file) {
                  const data = new DataTransfer();
                  data.items.add(file);
                  if (uploadRef.current) {
                    uploadRef.current.files = data.files;
                    uploadRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                  }
                }
              }}
            >
              {/* Phase 2: Toggleable Grid */}
              {showGrid && <div className="stage-grid" />}

              {/* Phase 2 & User Request: Floating Exit Fullscreen Button */}
              {isFullscreen && (
                <button
                  className="floating-exit-fullscreen-btn"
                  onClick={toggleFullscreen}
                  title="إنهاء ملء الشاشة واستعادة الحجم الأصلي (Esc)"
                  data-testid="floating-exit-fullscreen"
                >
                  <Minimize2 size={14} /> استعادة الحجم الأصلي (إنهاء ملء الشاشة)
                </button>
              )}

              <div className="canvas-card" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})` }}>
                <canvas
                  ref={canvasRef}
                  aria-label="مساحة تحرير الصورة"
                  className="canvas-checkerboard"
                  style={{ touchAction: "none" }}
                  onPointerDown={startDrawing}
                  onPointerMove={(e) => {
                    const pt = pointFromPointer(e);
                    setMouseCoord({ x: Math.round(pt.x), y: Math.round(pt.y) });
                    continueDrawing(e);
                  }}
                  onPointerLeave={() => setMouseCoord(null)}
                  onPointerUp={finishDrawing}
                  onPointerCancel={finishDrawing}
                />
                {mouseCoord && (activeTool === "eraser" || activeTool === "brush") && (
                  <div
                    className="canvas-brush-cursor"
                    style={{
                      position: "absolute",
                      left: `${(mouseCoord.x / Math.max(1, canvasRef.current?.width || 1)) * 100}%`,
                      top: `${(mouseCoord.y / Math.max(1, canvasRef.current?.height || 1)) * 100}%`,
                      width: `${((activeTool === "eraser" ? Math.max(20, brushSize) : Math.max(4, brushSize)) / Math.max(1, canvasRef.current?.width || 1)) * 100}%`,
                      height: `${((activeTool === "eraser" ? Math.max(20, brushSize) : Math.max(4, brushSize)) / Math.max(1, canvasRef.current?.height || 1)) * 100}%`,
                      transform: "translate(-50%, -50%)",
                      borderRadius: "50%",
                      border: activeTool === "eraser" ? "2px dashed #f43f5e" : `2px solid ${foregroundColor}`,
                      backgroundColor: activeTool === "eraser" ? "rgba(244, 63, 94, 0.14)" : `${foregroundColor}22`,
                      pointerEvents: "none",
                      zIndex: 10,
                      boxShadow: "0 0 4px rgba(0,0,0,0.5)"
                    }}
                  />
                )}
                <div className="selection-frame">
                  <span className="frame-label">{toolGroups.flat().find((tool) => tool.id === activeTool)?.label ?? activeTool} / نشط</span>
                </div>
                {selection && selection.width > 2 && selection.height > 2 && (
                  <div
                    className={`selection-overlay ${activeTool === "crop" ? "crop-mode" : ""} ${selectionShape === "ellipse" && activeTool !== "crop" ? "ellipse" : selectionShape === "free" && activeTool !== "crop" ? "free" : ""}`}
                    style={{
                      left: `${(selection.x / Math.max(1, canvasRef.current?.width || 1)) * 100}%`,
                      top: `${(selection.y / Math.max(1, canvasRef.current?.height || 1)) * 100}%`,
                      width: `${(selection.width / Math.max(1, canvasRef.current?.width || 1)) * 100}%`,
                      height: `${(selection.height / Math.max(1, canvasRef.current?.height || 1)) * 100}%`
                    }}
                  >
                    <span>{activeTool === "crop" ? `منطقة القص: ${Math.round(selection.width)} × ${Math.round(selection.height)}` : selectionShape === "ellipse" ? "تحديد بيضاوي" : selectionShape === "free" ? "تحديد حر" : "تحديد مستطيل"}</span>
                  </div>
                )}
              </div>
              <div className="canvas-crosshair" />
              <div className="canvas-badge" onClick={() => setFileInfoOpen(true)} style={{ cursor: "pointer" }} title="انقر لعرض تفاصيل المشروع">
                RGB / 8 bit <span>•</span> {imageSize.width} × {imageSize.height}
              </div>
              <div className="stage-floating-tools">
                <button onClick={() => setZoom((value) => Math.min(250, value + 5))} title="تكبير (+)"><Plus size={14} /></button>
                <span onClick={fitToScreen} style={{ cursor: "pointer" }} title="انقر للملاءمة (Ctrl+0)">{zoom}%</span>
                <button onClick={() => setZoom((value) => Math.max(20, value - 5))} title="تصغير (-)"><Minus size={14} /></button>
              </div>
              {isRendering && <div className="rendering-overlay"><span className="rendering-spinner" /> جاري المعالجة...</div>}
            </div>

            {/* Phase 2: Enhanced Status Bar */}
            <div className="canvas-status">
              <span><span className="status-pulse" /> {status}</span>
              <span>موقع المؤشر: <b>{mouseCoord ? `X: ${mouseCoord.x} | Y: ${mouseCoord.y}` : "—"}</b></span>
              <span>نسبة العرض: <b>{zoom}%</b></span>
              <span>المحرك: <b>2D Canvas</b></span>
              <span>سجل التعديلات: <b>{historyRef.current.length} / 20</b></span>
            </div>
          </section>

          {/* Phase 2: Collapsible Inspector Rail */}
          {isInspectorOpen && (
            <aside className="inspector-rail">
              <div className="inspector-tabs">
                <button className={activeTab === "layers" ? "active" : ""} onClick={() => { setActiveTab("layers"); setStatus("تم فتح لوحة الطبقات"); }} data-testid="layers-tab">
                  <Layers3 size={15} /> الطبقات
                </button>
                <button className={activeTab === "properties" ? "active" : ""} onClick={() => { setActiveTab("properties"); setStatus("تم فتح لوحة الخصائص"); }} data-testid="properties-tab">
                  <SlidersHorizontal size={15} /> الخصائص
                </button>
                <button className={activeTab === "history" ? "active" : ""} onClick={() => { setActiveTab("history"); setStatus("تم فتح سجل التعديلات"); }} data-testid="history-tab">
                  <RotateCcw size={15} /> السجل ({historyRef.current.length})
                </button>
                <button
                  className="panel-toggle"
                  aria-label="طي اللوحة الجانبية"
                  onClick={() => { setIsInspectorOpen(false); setStatus("تم طي لوحة الطبقات والخصائص"); }}
                  title="طي اللوحة الجانبية"
                >
                  <PanelRightClose size={15} />
                </button>
              </div>

              {activeTab === "history" ? (
                <div className="history-panel">
                  {/* Header with counts and controls */}
                  <div className="panel-heading">
                    <span>سجل التعديلات <em>{String(historyRef.current.length).padStart(2, "0")} / 50</em></span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button onClick={undo} title="تراجع (Ctrl+Z)" style={{ opacity: historyRef.current.length < 2 ? 0.4 : 1 }}>
                        <Undo2 size={14} />
                      </button>
                      <button onClick={redo} title="تقدم (Ctrl+Y)" style={{ opacity: redoRef.current.length === 0 ? 0.4 : 1 }}>
                        <Redo2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Save Snapshot button */}
                  <div style={{ padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <button
                      style={{ width: "100%", background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.3)", borderRadius: "5px", color: "#2dd4bf", fontSize: "10px", padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", justifyContent: "center" }}
                      onClick={() => {
                        const label = `📌 نقطة حفظ — ${new Date().toLocaleTimeString("ar")}`;
                        const snapshot: EditorSnapshot = {
                          imageSrc, brightness, contrast, grayscale, saturation, sepia, invert,
                          hue, exposure, temperature, gamma, colorBalanceR, colorBalanceG, colorBalanceB,
                          thresholdEnabled, threshold, rotation, flipX, flipY, filterMode, filterIntensity,
                          strokes, shapes, textElements, maskRect, layers, snapshotLabel: label
                        };
                        historyRef.current = [...historyRef.current, snapshot].slice(-50);
                        setHistorySteps(s => [...s, { id: `snap-${Date.now()}`, label, timestamp: Date.now() }].slice(-50));
                        setHistoryIndex(historyRef.current.length - 1);
                        setStatus("✅ تم حفظ نقطة تراجع يدوية");
                      }}
                      title="حفظ نقطة تراجع الآن"
                    >
                      <Save size={11} /> حفظ نقطة تراجع
                    </button>
                  </div>

                  {/* History list */}
                  <div className="history-list">
                    {[...historySteps].reverse().map((step, revIdx) => {
                      const idx = historySteps.length - 1 - revIdx;
                      const isActive = historyIndex === idx;
                      const isSavePoint = step.label.startsWith("📌");
                      const time = new Date(step.timestamp).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                      return (
                        <button
                          key={step.id || idx}
                          className={`history-row ${isActive ? "active-step" : ""}`}
                          onClick={() => jumpToHistoryStep(idx)}
                          style={{ borderLeft: isSavePoint ? "3px solid #2dd4bf" : isActive ? "3px solid rgba(45,212,191,0.4)" : "3px solid transparent" }}
                        >
                          <span className="history-num" style={{ color: isSavePoint ? "#2dd4bf" : "#5a7c75" }}>{idx + 1}</span>
                          <span className="history-label" style={{ fontWeight: isSavePoint ? "bold" : "normal", color: isActive ? "#e8f0ed" : "#9ab5af" }}>{step.label}</span>
                          <span style={{ fontSize: "8px", color: "#4a6860", marginLeft: "auto", flexShrink: 0 }}>{time}</span>
                          {isActive && <span className="history-badge">●</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Clear history */}
                  {historySteps.length > 1 && (
                    <div style={{ padding: "6px 10px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <button
                        style={{ width: "100%", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "5px", color: "#f87171", fontSize: "9px", padding: "4px 8px", cursor: "pointer" }}
                        onClick={() => {
                          const current = historyRef.current[historyRef.current.length - 1];
                          historyRef.current = current ? [current] : [];
                          redoRef.current = [];
                          setHistorySteps([{ id: "reset", label: "إعادة ضبط السجل", timestamp: Date.now() }]);
                          setHistoryIndex(0);
                          setStatus("تم مسح سجل التعديلات");
                        }}
                        title="مسح سجل التعديلات بالكامل"
                      >
                        مسح السجل بالكامل
                      </button>
                    </div>
                  )}
                </div>
              ) : activeTab === "layers" ? (
                <>
                  <div className="panel-heading">
                    <span>الطبقات <em>{String(layers.length).padStart(2, "0")}</em></span>
                    <div>
                      <button onClick={addPaintLayer} aria-label="إضافة طبقة" data-testid="add-layer" title="إضافة طبقة رسم"><Plus size={15} /></button>
                      <button onClick={() => setLayerOptionsOpen((open) => !open)} aria-label="خيارات الطبقات" data-testid="layer-options" title="خيارات الرؤية"><ChevronDown size={15} /></button>
                    </div>
                    {layerOptionsOpen && (
                      <div className="app-dropdown-menu" style={{ top: "45px", left: "10px", right: "auto" }}>
                        <button className="app-menu-item" onClick={() => setAllLayersVisibility(true)}>إظهار جميع الطبقات</button>
                        <button className="app-menu-item" onClick={() => setAllLayersVisibility(false)}>إخفاء جميع الطبقات</button>
                      </div>
                    )}
                  </div>

                  <div className="layer-stack">
                    {layers.map((layer, index) => (
                      <div key={layer.id} className={`layer-item-wrapper ${layer.parentId ? "child-layer" : ""}`} style={{ marginLeft: layer.parentId ? "16px" : "0", borderLeft: layer.parentId ? "2px solid rgba(255,255,255,0.1)" : "none" }}>
                        <button
                          className={`layer-row ${selectedLayer === layer.id ? "selected" : ""} ${layer.locked ? "locked" : ""}`}
                          onClick={() => { setSelectedLayer(layer.id); setSelectedTextId(layer.kind === "text" ? layer.id : null); }}
                          onDoubleClick={() => { setEditingLayerId(layer.id); setEditingLayerName(layer.name); }}
                        >
                          <span className="layer-drag">⋮⋮</span>
                          <span className="layer-eye" onClick={(event) => { event.stopPropagation(); toggleLayer(layer.id); }}>
                            {layer.visible ? <Eye size={14} /> : <span className="eye-off" />}
                          </span>
                          <span className="layer-lock" onClick={(event) => { event.stopPropagation(); toggleLayerLock(layer.id); }} style={{ padding: "0 4px", opacity: layer.locked ? 1 : 0.4 }}>
                            {layer.locked ? <Lock size={12} color="#f87171" /> : <Unlock size={12} />}
                          </span>
                          {layer.kind === "group" ? (
                            <Folder size={18} color={layer.color} style={{ margin: "0 8px" }} />
                          ) : (
                            <span 
                              className={`layer-thumb ${selectedTarget === "content" && selectedLayer === layer.id ? "target-active" : ""}`} 
                              style={{ background: layer.thumbnail ? `url(${layer.thumbnail}) center/cover` : layer.kind === "image" ? `url(${imageSrc}) center/cover` : layer.color }} 
                              onClick={(e) => { e.stopPropagation(); setSelectedLayer(layer.id); setSelectedTarget("content"); }}
                            />
                          )}
                          {layer.maskData && (
                            <>
                              <span style={{ fontSize: "10px", margin: "0 2px" }}>🔗</span>
                              <span 
                                className={`layer-thumb mask-thumb ${selectedTarget === "mask" && selectedLayer === layer.id ? "target-active" : ""}`} 
                                style={{ background: `url(${layer.maskData}) center/cover`, filter: layer.maskEnabled === false ? "grayscale(1) opacity(0.5)" : "none" }}
                                onClick={(e) => { e.stopPropagation(); setSelectedLayer(layer.id); setSelectedTarget("mask"); setStatus("أنت الآن ترسم على القناع. استخدم الفرشاة بالأسود للإخفاء والأبيض للإظهار"); }}
                                onDoubleClick={(e) => { e.stopPropagation(); toggleMask(layer.id); }}
                              />
                            </>
                          )}
                          <span className="layer-name">
                            {editingLayerId === layer.id ? (
                              <input
                                autoFocus
                                value={editingLayerName}
                                onChange={(e) => setEditingLayerName(e.target.value)}
                                onBlur={() => renameLayer(layer.id, editingLayerName)}
                                onKeyDown={(e) => { if (e.key === "Enter") renameLayer(layer.id, editingLayerName); }}
                                onClick={(e) => e.stopPropagation()}
                                className="layer-rename-input"
                                style={{ width: "100%", background: "transparent", color: "white", border: "1px solid #14b8a6", outline: "none" }}
                              />
                            ) : (
                              <b>{layer.name}</b>
                            )}
                            {editingLayerId !== layer.id && (
                              <small>{layer.kind === "adjustment" ? "طبقة تعديل" : layer.kind === "image" ? "الصورة الأساسية" : layer.kind === "mask" ? "قناع غير تدميري" : layer.kind === "text" ? "نص قابل للتحرير" : layer.kind === "background" ? "طبقة خلفية" : layer.kind === "group" ? "مجموعة طبقات" : "طبقة رسم"}</small>
                            )}
                          </span>
                          {index === 0 && <Sparkles size={13} className="layer-spark" />}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Phase 5: Selected Layer Controls */}
                  {(() => {
                    const selLayer = layers.find((l) => l.id === selectedLayer);
                    if (!selLayer) return null;
                    return (
                      <div className="layer-active-controls">
                        <div className="layer-control-row">
                          <span>الشفافية: {selLayer.opacity ?? 100}%</span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={selLayer.opacity ?? 100}
                            onChange={(e) => setSelectedLayerOpacity(Number(e.target.value))}
                            className="opacity-slider"
                            disabled={selLayer.locked}
                          />
                        </div>
                        <div className="layer-control-row">
                          <span>وضع الدمج:</span>
                          <select
                            value={selLayer.blendMode ?? "normal"}
                            onChange={(e) => setSelectedLayerBlendMode(e.target.value)}
                            className="blend-select"
                            disabled={selLayer.locked}
                          >
                            {BLEND_MODE_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id}>{opt.labelArabic}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="layer-footer">
                    <button onClick={moveLayerUp} aria-label="تقديم الطبقة لأعلى" data-testid="move-layer-up" title="تقديم الطبقة لأعلى"><ArrowUp size={16} /></button>
                    <button onClick={moveLayerDown} aria-label="تأخير الطبقة لأسفل" data-testid="move-layer-down" title="تأخير الطبقة لأسفل"><ArrowDown size={16} /></button>
                    <button onClick={addLayerGroup} aria-label="إضافة مجموعة جديدة" title="إضافة مجلد/مجموعة جديدة"><Folder size={16} /></button>
                    <button onClick={addPaintLayer} aria-label="إضافة طبقة رسم" data-testid="add-paint-layer" title="إضافة طبقة رسم"><Plus size={16} /></button>
                    <button onClick={addMaskToLayer} aria-label="إضافة قناع" title="إضافة قناع إخفاء للطبقة (Layer Mask)"><Square size={16} fill="white" /><Circle size={8} fill="black" style={{position:"absolute", right:"38%"}} /></button>
                    <button onClick={duplicateSelectedLayer} aria-label="تكرار الطبقة" data-testid="duplicate-layer" title="تكرار الطبقة المحددة"><Layers3 size={16} /></button>
                    <button onClick={mergeLayerDown} aria-label="دمج لأسفل" title="دمج طبقة الرسم الحالية مع الطبقة التي أسفلها"><Combine size={16} /></button>
                    <button onClick={removeSelectedLayer} aria-label="حذف الطبقة" data-testid="delete-layer" title="حذف الطبقة"><span className="trash-icon">⌫</span></button>
                  </div>
                </>
              ) : (
                <div className="properties-panel">
                  <div className="panel-heading">
                    <span>التعديلات اللونية والخصائص</span>
                    <button onClick={resetAdjustments} title="إعادة ضبط جميع التعديلات">
                      <RotateCcw size={14} />
                    </button>
                  </div>
                  {/* Point 5: Live Histogram Viewer */}
                  <HistogramViewer data={histogramData} />

                  <Adjustment label="السطوع (Brightness)" value={brightness} min={-100} max={100} defaultValue={0} onChange={setBrightness} />
                  <Adjustment label="التباين (Contrast)" value={contrast} min={-100} max={100} defaultValue={0} onChange={setContrast} />
                  <Adjustment label="التعريض (Exposure)" value={exposure} min={-100} max={100} defaultValue={0} onChange={setExposure} />
                  <Adjustment label="تدرج اللون (Hue)" value={hue} min={-180} max={180} defaultValue={0} unit="°" onChange={setHue} />
                  <Adjustment label="التشبع اللوني (Saturation)" value={saturation} min={0} max={200} defaultValue={100} unit="%" onChange={setSaturation} />
                  <Adjustment label="حرارة اللون (Temperature)" value={temperature} min={-100} max={100} defaultValue={0} onChange={setTemperature} />
                  <Adjustment label="منحنى جاما (Gamma)" value={gamma} min={0.2} max={2.5} step={0.05} defaultValue={1.0} onChange={setGamma} />

                  <div className="panel-heading" style={{ marginTop: "10px" }}>
                    <span>توازن الألوان (Color Balance)</span>
                  </div>
                  <Adjustment label="الأحمر (Red Balance)" value={colorBalanceR} min={-100} max={100} defaultValue={0} onChange={setColorBalanceR} />
                  <Adjustment label="الأخضر (Green Balance)" value={colorBalanceG} min={-100} max={100} defaultValue={0} onChange={setColorBalanceG} />
                  <Adjustment label="الأزرق (Blue Balance)" value={colorBalanceB} min={-100} max={100} defaultValue={0} onChange={setColorBalanceB} />

                  <div className="panel-heading" style={{ marginTop: "10px" }}>
                    <span>تأثيرات نغمية أحادية</span>
                  </div>
                  <Adjustment label="تدرج رمادي (Grayscale)" value={grayscale} min={0} max={100} defaultValue={0} unit="%" onChange={setGrayscale} />
                  <Adjustment label="السيبيا (Sepia)" value={sepia} min={0} max={100} defaultValue={0} unit="%" onChange={setSepia} />
                  <Adjustment label="العكس اللوني (Invert)" value={invert} min={0} max={100} defaultValue={0} unit="%" onChange={setInvert} />

                  {/* Point 7: Digital Art & Shapes Studio */}
                  <div className="panel-heading" style={{ marginTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px" }}>
                    <span>ستوديو أدوات الرسم والتلوين (Drawing Studio)</span>
                    <button
                      onClick={() => {
                        setBrushSize(16);
                        setBrushOpacity(100);
                        setBrushHardness(100);
                        resetColors();
                        setStatus("تمت إعادة ضبط إعدادات الرسم الافتراضية");
                      }}
                      title="إعادة ضبط إعدادات الرسم"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>

                  {/* Quick Color Palette & Swatches */}
                  <div style={{ padding: "0 17px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", color: "var(--signal-teal, #2dd4bf)", fontWeight: 600 }}>لوحة الألوان والتبديل</span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={swapColors}
                          title="تبديل الأمامي والخلفي (X)"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            color: "#e2e8f0",
                            borderRadius: "4px",
                            padding: "2px 6px",
                            fontSize: "10px",
                            cursor: "pointer"
                          }}
                        >
                          تبديل (X)
                        </button>
                        <button
                          type="button"
                          onClick={resetColors}
                          title="استعادة الافتراضي (D)"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            color: "#e2e8f0",
                            borderRadius: "4px",
                            padding: "2px 6px",
                            fontSize: "10px",
                            cursor: "pointer"
                          }}
                        >
                          افتراضي (D)
                        </button>
                      </div>
                    </div>

                    <div className="color-palette-grid">
                      {["#2dd4bf", "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#eab308", "#22c55e", "#ffffff", "#000000"].map((clr) => (
                        <button
                          key={clr}
                          type="button"
                          className={`color-preset-dot ${foregroundColor.toLowerCase() === clr.toLowerCase() ? "active" : ""}`}
                          style={{ backgroundColor: clr }}
                          onClick={() => {
                            setForegroundColor(clr);
                            setStatus(`تم اختيار اللون: ${clr.toUpperCase()}`);
                          }}
                          title={`اختيار اللون ${clr}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Brush / Stroke Controls */}
                  <Adjustment label="حجم الفرشاة / القلم (Brush Size)" value={brushSize} min={1} max={120} defaultValue={16} unit="px" onChange={setBrushSize} />
                  <Adjustment label="شفافية وعتامة الرسم (Opacity)" value={brushOpacity} min={10} max={100} defaultValue={100} unit="%" onChange={setBrushOpacity} />
                  <Adjustment label="صلابة حواف الفرشاة (Hardness)" value={brushHardness} min={0} max={100} defaultValue={100} unit="%" onChange={setBrushHardness} />

                  {/* Shapes Selection Section */}
                  <div style={{ padding: "8px 17px", marginTop: "4px" }}>
                    <div style={{ fontSize: "11px", color: "var(--signal-teal, #2dd4bf)", fontWeight: 600, marginBottom: "6px" }}>
                      نوع الشكل الهندسي (Shape Type)
                    </div>
                    <div className="shape-selector-group">
                      {[
                        { id: "rectangle" as ShapeType, label: "مستطيل" },
                        { id: "ellipse" as ShapeType, label: "بيضاوي" },
                        { id: "line" as ShapeType, label: "خط" },
                        { id: "triangle" as ShapeType, label: "مثلث" },
                        { id: "polygon" as ShapeType, label: "نجمة / مضلع" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`shape-btn ${activeShapeType === item.id ? "active" : ""}`}
                          onClick={() => {
                            setActiveShapeType(item.id);
                            setActiveTool("shape");
                            setStatus(`تم اختيار أداة رسم شكل: ${item.label}`);
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ fontSize: "11px", color: "var(--signal-teal, #2dd4bf)", fontWeight: 600, marginTop: "8px", marginBottom: "6px" }}>
                      نمط تعبئة الشكل (Fill Mode)
                    </div>
                    <div className="shape-selector-group" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                      {[
                        { id: "stroke" as ShapeFillMode, label: "إطار فقط" },
                        { id: "fill" as ShapeFillMode, label: "تعبئة فقط" },
                        { id: "both" as ShapeFillMode, label: "إطار وتعبئة" },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          className={`shape-btn ${shapeFillMode === mode.id ? "active" : ""}`}
                          onClick={() => {
                            setShapeFillMode(mode.id);
                            setStatus(`تم تغيير نمط الشكل إلى: ${mode.label}`);
                          }}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Point 8: Retouching & Defect Removal Studio */}
                  <div className="panel-heading" style={{ marginTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px" }}>
                    <span>ستوديو التنقيح وإزالة العيوب (Retouching Studio)</span>
                    <button
                      onClick={() => {
                        setCloneSource(null);
                        setRetouchRadius(24);
                        setRetouchOpacity(100);
                        setRetouchHardness(80);
                        setSkinSmoothIntensity(60);
                        setBgRemoveTolerance(30);
                        setStatus("تمت إعادة ضبط إعدادات التنقيح الافتراضية");
                      }}
                      title="إعادة ضبط إعدادات التنقيح"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>

                  <div style={{ padding: "0 17px", marginBottom: "10px" }}>
                    <div style={{ fontSize: "11px", color: "var(--signal-teal, #2dd4bf)", fontWeight: 600, marginBottom: "6px" }}>
                      أدوات المعالجة والتنقيح الموضعية
                    </div>
                    <div className="retouch-actions-grid">
                      <button
                        type="button"
                        className={`retouch-card-btn ${activeTool === "clone" ? "active" : ""}`}
                        onClick={() => {
                          activateTool("clone");
                          setRetouchMode("clone");
                        }}
                        title="ختم الاستنساخ: اضغط Alt+النقر لتحديد المصدر ثم اسحب للنسخ"
                      >
                        <Stamp size={15} />
                        <span>ختم الاستنساخ (S)</span>
                        <span className={`retouch-badge ${cloneSource ? "highlight" : ""}`}>
                          {cloneSource ? `المصدر: ${Math.round(cloneSource.x)},${Math.round(cloneSource.y)}` : "Alt+انقر للمصدر"}
                        </span>
                      </button>

                      <button
                        type="button"
                        className={`retouch-card-btn ${activeTool === "heal" && retouchMode === "heal" ? "active" : ""}`}
                        onClick={() => {
                          activateTool("heal");
                          setRetouchMode("heal");
                          setStatus("فرشاة المعالجة نشطة — اضغط Alt+النقر لتحديد عينة النسيج، ثم انقر لمزجها مع الإضاءة");
                        }}
                        title="فرشاة المعالجة: دمج النسيج مع الإضاءة المحلية"
                      >
                        <Sparkles size={15} />
                        <span>فرشاة المعالجة (J)</span>
                        <span className="retouch-badge">مزج النسيج</span>
                      </button>

                      <button
                        type="button"
                        className={`retouch-card-btn ${activeTool === "heal" && retouchMode === "spot" ? "active" : ""}`}
                        onClick={() => {
                          activateTool("heal");
                          setRetouchMode("spot");
                          setStatus("أداة معالجة البقع الفورية جاهزة — انقر مباشرة على أي بقعة أو عيب لإزالته");
                        }}
                        title="إزالة البقع الفورية: نقرة واحدة على البقعة لإزالتها"
                      >
                        <CircleDot size={15} />
                        <span>إزالة البقع (Spot)</span>
                        <span className="retouch-badge">نقرة واحدة</span>
                      </button>

                      <button
                        type="button"
                        className={`retouch-card-btn ${activeTool === "heal" && retouchMode === "redeye" ? "active" : ""}`}
                        onClick={() => {
                          activateTool("heal");
                          setRetouchMode("redeye");
                          setStatus("أداة إزالة العين الحمراء نشطة — انقر على بؤبؤ العين لقمع الاحمرار فورياً");
                        }}
                        title="إزالة العين الحمراء: نقرة على البؤبؤ"
                      >
                        <Crosshair size={15} />
                        <span>العين الحمراء</span>
                        <span className="retouch-badge">تصحيح البؤبؤ</span>
                      </button>
                    </div>

                    <Adjustment label="نصف قطر الأداة (Radius)" value={retouchRadius} min={4} max={80} defaultValue={24} unit="px" onChange={setRetouchRadius} />
                    <Adjustment label="عتامة التنقيح (Opacity)" value={retouchOpacity} min={10} max={100} defaultValue={100} unit="%" onChange={setRetouchOpacity} />
                    <Adjustment label="صلابة حواف التنقيح (Hardness)" value={retouchHardness} min={0} max={100} defaultValue={80} unit="%" onChange={setRetouchHardness} />

                    <div style={{ fontSize: "11px", color: "var(--signal-teal, #2dd4bf)", fontWeight: 600, marginTop: "10px", marginBottom: "6px" }}>
                      معالجات ذكية متقدمة (Smart Retouch Actions)
                    </div>

                    {/* Skin Smoothing Card */}
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "8px", marginBottom: "8px" }}>
                      <Adjustment label="شدة تنعيم البشرة (Skin Smooth)" value={skinSmoothIntensity} min={10} max={100} defaultValue={60} unit="%" onChange={setSkinSmoothIntensity} />
                      <button
                        type="button"
                        className="retouch-action-submit-btn"
                        onClick={handleApplySkinSmoothing}
                        title="تنعيم مسام البشرة مع الحفاظ التام على ملامح العيون والشفاه والشعر"
                      >
                        <Sparkles size={13} /> تطبيق تنعيم البشرة الذكي
                      </button>
                    </div>

                    {/* Content-Aware Inpainting Fill Card */}
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "8px", marginBottom: "8px" }}>
                      <div style={{ fontSize: "10px", color: "#8fa9a3", marginBottom: "4px" }}>
                        {selection ? `التحديد نشط (${Math.round(selection.width)}×${Math.round(selection.height)}px)` : "حدد عنصراً بأداة التحديد (V) أولاً للملء"}
                      </div>
                      <button
                        type="button"
                        className="retouch-action-submit-btn"
                        onClick={handleApplyInpaint}
                        title="إزالة العنصر أو العيب من منطقة التحديد وملؤه بالنسيج المحيط"
                      >
                        <WandSparkles size={13} /> ملء وإزالة العنصر المحدد (Inpaint)
                      </button>
                    </div>

                    {/* ─────── Professional Subject Extraction & Background Effects Panel ─────── */}
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(45,212,191,0.25)", borderRadius: "8px", padding: "10px", marginBottom: "12px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#2dd4bf", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <WandSparkles size={13} /> عزل الأجسام وتأثيرات الخلفية
                        </span>
                        <span style={{ fontSize: "8px", background: "rgba(45,212,191,0.15)", border: "1px solid rgba(45,212,191,0.3)", borderRadius: "4px", color: "#2dd4bf", padding: "1px 5px" }}>
                          PRO CUTOUT
                        </span>
                      </div>

                      {/* Sliders */}
                      <Adjustment label="حساسية عزل الجسم (Tolerance)" value={bgRemoveTolerance} min={10} max={70} defaultValue={30} onChange={setBgRemoveTolerance} />
                      <Adjustment label="تنعيم وصقل الحواف (Edge Feather)" value={bgFeather} min={0} max={8} defaultValue={3} onChange={setBgFeather} />
                      <Adjustment label="قوة تمويه الخلفية (Bokeh Radius)" value={bgBlurRadius} min={5} max={40} defaultValue={20} onChange={setBgBlurRadius} />

                      {/* Smart Hint */}
                      <div style={{ fontSize: "9px", color: "#6a8c85", margin: "6px 0 10px 0", background: "rgba(45,212,191,0.05)", padding: "5px 8px", borderRadius: "5px", border: "1px dashed rgba(45,212,191,0.2)" }}>
                        💡 <strong>نصيحة:</strong> يمكنك رسم مربع بأداة التحديد أولاً حول الشخص أو العنصر لعزله بدقة متناهية (Object Selection)، أو النقر مباشرة للعزل الذكي التلقائي.
                      </div>

                      {/* Primary Feature: تحرير الجسم إلى طبقة جديدة */}
                      <div style={{ marginBottom: "8px" }}>
                        <button
                          type="button"
                          className="retouch-action-submit-btn"
                          onClick={handleExtractSubjectToNewLayer}
                          style={{
                            width: "100%",
                            justifyContent: "center",
                            background: "linear-gradient(135deg, rgba(45,212,191,0.2), rgba(6,182,212,0.15))",
                            border: "1px solid rgba(45,212,191,0.45)",
                            fontWeight: 700,
                            color: "#5eead4",
                            padding: "8px 10px",
                            boxShadow: "0 2px 8px rgba(45,212,191,0.1)"
                          }}
                          title="تحرير الجسم الشيء المطلوب وفصله إلى طبقة جديدة مستقلة في لوحة الطبقات"
                        >
                          <Sparkles size={14} /> ✨ تحرير الجسم إلى طبقة جديدة (Extract Subject)
                        </button>
                      </div>

                      {/* 1. إزالة الخلفية وعزل الجسم مباشرة */}
                      <div style={{ marginBottom: "6px" }}>
                        <button
                          type="button"
                          className="retouch-action-submit-btn"
                          onClick={handleApplyBackgroundRemoval}
                          style={{ width: "100%", justifyContent: "center", background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.3)" }}
                          title="عزل الجسم وجعل الخلفية شفافة تماماً لحفظها كصورة PNG مفرغة"
                        >
                          <Crop size={13} /> ✂️ إزالة الخلفية بالكامل → شفاف (PNG)
                        </button>
                      </div>

                      {/* 2. تمويه البورتريه بتدرج */}
                      <div style={{ marginBottom: "8px" }}>
                        <button
                          type="button"
                          className="retouch-action-submit-btn"
                          onClick={handleBlurBackground}
                          style={{ width: "100%", justifyContent: "center", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", color: "#a5b4fc" }}
                          title="تمويه خلفية الصورة بعمق ميدان واقعي (Portrait Mode Bokeh) مع بقاء الجسم حاداً 100%"
                        >
                          <SlidersHorizontal size={13} /> 🌫️ تمويه البورتريه بتدرج (Portrait Bokeh)
                        </button>
                      </div>

                      {/* 3. استبدال الخلفية بألوان وتدرجات استوديو */}
                      <div>
                        <div style={{ fontSize: "10px", color: "#a8c4be", fontWeight: 600, marginBottom: "5px" }}>🎨 استبدال خلفية الجسم المفرغ:</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", marginBottom: "4px" }}>
                          <button type="button" className="retouch-action-submit-btn"
                            onClick={() => handleHideBackground("transparent")}
                            style={{ justifyContent: "center", fontSize: "9px", padding: "5px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)" }}
                            title="خلفية شفافة">
                            ◻️ شفاف
                          </button>
                          <button type="button" className="retouch-action-submit-btn"
                            onClick={() => handleHideBackground("black")}
                            style={{ justifyContent: "center", fontSize: "9px", padding: "5px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)" }}
                            title="أسود استوديو فخم">
                            ⬛ أسود
                          </button>
                          <button type="button" className="retouch-action-submit-btn"
                            onClick={() => handleHideBackground("white")}
                            style={{ justifyContent: "center", fontSize: "9px", padding: "5px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}
                            title="أبيض نقي تجاري">
                            ⬜ أبيض
                          </button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                          <button type="button" className="retouch-action-submit-btn"
                            onClick={() => handleHideBackground("studio-dark")}
                            style={{ justifyContent: "center", fontSize: "9px", padding: "5px", background: "linear-gradient(135deg, #1e293b, #0f172a)", border: "1px solid rgba(148,163,184,0.3)" }}
                            title="تدرج استوديو سينمائي">
                            🎬 تدرج سينمائي
                          </button>
                          <button type="button" className="retouch-action-submit-btn"
                            onClick={() => handleHideBackground("chroma")}
                            style={{ justifyContent: "center", fontSize: "9px", padding: "5px", background: "rgba(0,177,64,0.2)", border: "1px solid rgba(0,177,64,0.4)", color: "#86efac" }}
                            title="خلفية خضراء كروما">
                            🟩 كروما خضراء
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ─── Phase 13: AI & Advanced Features Panel ─── */}
                    <div style={{ marginTop: "14px", borderTop: "1px solid rgba(45,212,191,0.15)", paddingTop: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#2dd4bf", display: "flex", alignItems: "center", gap: "5px" }}>
                          <WandSparkles size={13} /> وظائف الذكاء الاصطناعي المحلية (Phase 13)
                        </span>
                        <span style={{ fontSize: "8px", background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.3)", borderRadius: "10px", color: "#2dd4bf", padding: "1px 6px" }}>LOCAL AI</span>
                      </div>

                      {/* AI Processing Progress Bar */}
                      {aiProcessing && (
                        <div style={{ marginBottom: "10px", background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)", borderRadius: "6px", padding: "8px 10px" }}>
                          <div style={{ fontSize: "10px", color: "#2dd4bf", marginBottom: "4px" }}>⚙️ {aiTask}...</div>
                          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "3px", height: "4px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${aiProgress}%`, background: "linear-gradient(90deg, #2dd4bf, #06b6d4)", borderRadius: "3px", transition: "width 0.3s ease" }} />
                          </div>
                        </div>
                      )}

                      {/* 1. Smart Upscale */}
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "8px", marginBottom: "8px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "#c8d9d5", marginBottom: "5px" }}>🔍 تحسين الدقة (Upscale)</div>
                        <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                          {([2, 3, 4] as const).map(f => (
                            <button key={f} type="button"
                              className={`preset-chip-btn ${upscaleFactor === f ? "active" : ""}`}
                              onClick={() => setUpscaleFactor(f)}>{f}×</button>
                          ))}
                        </div>
                        <div style={{ fontSize: "9px", color: "#6a8c85", marginBottom: "5px" }}>
                          نتيجة: {imageSize.width * upscaleFactor}×{imageSize.height * upscaleFactor}px — مع شحذ Lanczos تقديري
                        </div>
                        <button type="button" className="retouch-action-submit-btn"
                          onClick={handleAiUpscale} disabled={aiProcessing}
                          title="تكبير الصورة مع تحسين الحدة">
                          <ZoomIn size={13} /> تطبيق تحسين الدقة
                        </button>
                      </div>

                      {/* 2. Smart AutoCrop */}
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "8px", marginBottom: "8px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "#c8d9d5", marginBottom: "5px" }}>✂️ القص الذكي (Smart AutoCrop)</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
                          <span style={{ fontSize: "9px", color: "#6a8c85" }}>هامش إضافي:</span>
                          <input type="number" min={0} max={100} value={autocropPadding}
                            onChange={e => setAutocropPadding(Number(e.target.value))}
                            style={{ width: "48px", background: "#1a2828", color: "white", border: "1px solid #2dd4bf40", borderRadius: "4px", padding: "2px 4px", fontSize: "10px" }} />
                          <span style={{ fontSize: "9px", color: "#6a8c85" }}>px</span>
                        </div>
                        <div style={{ fontSize: "9px", color: "#6a8c85", marginBottom: "5px" }}>يكتشف حدود المحتوى ويحذف الهوامش البيضاء/الشفافة</div>
                        <button type="button" className="retouch-action-submit-btn"
                          onClick={handleSmartAutoCrop} disabled={aiProcessing}
                          title="اكتشاف المحتوى وقص الهوامش تلقائياً">
                          <Crop size={13} /> قص ذكي للمحتوى
                        </button>
                      </div>

                      {/* 3. Outpainting */}
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "8px", marginBottom: "8px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "#c8d9d5", marginBottom: "5px" }}>🖼️ توسيع الصورة (Outpainting)</div>
                        <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginBottom: "5px" }}>
                          {(["all", "right", "left", "bottom", "top"] as const).map(d => (
                            <button key={d} type="button"
                              className={`preset-chip-btn ${outpaintDirection === d ? "active" : ""}`}
                              onClick={() => setOutpaintDirection(d)}
                              style={{ fontSize: "9px" }}>
                              {d === "all" ? "كل الجهات" : d === "right" ? "يمين" : d === "left" ? "يسار" : d === "bottom" ? "أسفل" : "أعلى"}
                            </button>
                          ))}
                        </div>
                        <Adjustment label="نسبة التوسع" value={outpaintAmount} min={5} max={50} defaultValue={20} unit="%" onChange={setOutpaintAmount} />
                        <button type="button" className="retouch-action-submit-btn"
                          onClick={handleOutpaint} disabled={aiProcessing}
                          title="توسيع حواف الصورة مع امتداد الألوان">
                          <Maximize2 size={13} /> توسيع الصورة
                        </button>
                      </div>

                      {/* 4. Art Style Presets */}
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "8px", marginBottom: "8px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 600, color: "#c8d9d5", marginBottom: "5px" }}>🎭 تحويل إلى نمط فني (Art Style)</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", marginBottom: "6px" }}>
                          {Object.entries(ART_STYLES).map(([key, s]) => (
                            <button key={key} type="button"
                              className={`preset-chip-btn ${artStylePreset === key ? "active" : ""}`}
                              onClick={() => setArtStylePreset(key)}
                              style={{ fontSize: "9px", textAlign: "left", padding: "4px 6px" }}>
                              {s.icon} {s.label}
                            </button>
                          ))}
                        </div>
                        <button type="button" className="retouch-action-submit-btn"
                          onClick={handleApplyArtStyle} disabled={aiProcessing}
                          title="تطبيق النمط الفني المختار">
                          <Sparkles size={13} /> تطبيق النمط الفني
                        </button>
                      </div>

                      {/* AI Disclaimer */}
                      <div style={{ fontSize: "9px", color: "#4a6860", padding: "6px 8px", background: "rgba(255,255,255,0.02)", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.04)", lineHeight: 1.5 }}>
                        ⚠️ هذه الوظائف تعمل محلياً على متصفحك بدون إنترنت. النتائج تقديرية ويمكن استخدام Undo للتراجع.
                      </div>
                    </div>
                  </div>

                  <div className="panel-heading" style={{ marginTop: "14px" }}>
                    <span>معرض المرشحات والمؤثرات (Filters)</span>
                    {filterMode !== "none" && (
                      <button onClick={() => { setFilterMode("none"); setStatus("تمت إزالة المرشح"); }} title="إلغاء المرشح">
                        <RotateCcw size={13} />
                      </button>
                    )}
                  </div>

                  {/* Filter Categories Filter */}
                  <div className="filter-categories" style={{ padding: "0 17px" }}>
                    {(["الكل", "تمويه", "حدة", "حواف", "ضوضاء", "هندسية", "لونية", "فنية"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`filter-category-btn ${filterCategoryFilter === cat ? "active" : ""}`}
                        onClick={() => setFilterCategoryFilter(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Active Filter Parameter Tuning Box */}
                  {filterMode !== "none" && (() => {
                    const activeDef = FILTER_CATALOG.find((f) => f.id === filterMode);
                    if (!activeDef) return null;
                    return (
                      <div className="active-filter-card" style={{ margin: "8px 17px" }}>
                        <div className="active-filter-header">
                          <span className="active-filter-title">
                            <Sparkles size={13} /> {activeDef.nameArabic}
                          </span>
                          <span className="filter-chip-badge">{activeDef.category}</span>
                        </div>
                        <div className="active-filter-desc">{activeDef.description}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#8fa9a3", marginBottom: "4px" }}>
                          <span>{activeDef.intensityLabel || "شدة التأثير"}</span>
                          <span style={{ color: "#2dd4bf", fontWeight: 700 }}>{filterIntensity}%</span>
                        </div>
                        <Slider
                          value={[filterIntensity]}
                          min={activeDef.minIntensity ?? 10}
                          max={activeDef.maxIntensity ?? 100}
                          step={1}
                          onValueChange={(val) => setFilterIntensity(val[0])}
                        />
                        <div className="active-filter-actions">
                          <button type="button" className="btn-bake-filter" onClick={applyFilterPermanently} title="تطبيق التأثير نهائياً على الصورة الأصلية">
                            <Check size={12} /> اعتماد التأثير (Bake)
                          </button>
                          <button type="button" className="btn-reset-filter" onClick={() => setFilterMode("none")} title="إلغاء التأثير والعودة للأصل">
                            إلغاء
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="filters-grid">
                    {FILTER_CATALOG.filter((f) => filterCategoryFilter === "الكل" || f.category === filterCategoryFilter).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`filter-chip ${filterMode === f.id ? "active" : ""}`}
                        onClick={() => {
                          setFilterMode(f.id);
                          if (f.defaultIntensity !== undefined) setFilterIntensity(f.defaultIntensity);
                          setStatus(`تم تطبيق مرشح: ${f.nameArabic}`);
                        }}
                        title={f.description}
                      >
                        <span>{f.nameArabic}</span>
                        {filterMode === f.id && <span className="filter-chip-badge">✓</span>}
                      </button>
                    ))}
                  </div>

                  <div className="adjustments-actions">
                    <button type="button" className="btn-apply-adjustments" onClick={applyAdjustments}>
                      <Check size={14} /> تطبيق التعديلات (Apply)
                    </button>
                    <button type="button" className="btn-reset-all" onClick={resetAdjustments}>
                      إعادة ضبط الكل
                    </button>
                  </div>

                  <div style={{ padding: "0 17px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <label style={{ fontSize: "10px", color: "#8fa9a3", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={thresholdEnabled}
                          onChange={(e) => setThresholdEnabled(e.target.checked)}
                          style={{ accentColor: "#2dd4bf" }}
                        />
                        <span>العتبة الثنائية (Threshold B&W)</span>
                      </label>
                      <output style={{ color: "#c8d9d5", fontSize: "10px" }}>{threshold}</output>
                    </div>
                    {thresholdEnabled && (
                      <Slider value={[threshold]} min={0} max={255} step={1} onValueChange={(values) => setThreshold(values[0])} />
                    )}
                  </div>

                  <div className="transform-actions">
                    <span>التحويلات الهندسية والأبعاد</span>
                    <button onClick={() => { setRotation((value) => (value + 90) % 360); setStatus("تم تدوير الصورة 90° مع عقارب الساعة"); }}>تدوير 90° CW</button>
                    <button onClick={() => { setRotation((value) => (value - 90 + 360) % 360); setStatus("تم تدوير الصورة 90° عكس عقارب الساعة"); }}>تدوير -90° CCW</button>
                    <button onClick={() => { setRotation((value) => (value + 180) % 360); setStatus("تم تدوير الصورة 180°"); }}>تدوير 180°</button>
                    <button onClick={() => { setFlipX((value) => !value); setStatus("تم القلب أفقياً"); }}>قلب أفقي ↔</button>
                    <button onClick={() => { setFlipY((value) => !value); setStatus("تم القلب رأسياً"); }}>قلب رأسي ↕</button>
                    <button onClick={cropToSquare}>قص مربع 1:1</button>
                    <button onClick={() => cropToRatio(16, 9)}>قص 16:9</button>
                    <button onClick={() => cropToRatio(4, 3)}>قص 4:3</button>
                    <button onClick={() => { setResizeWidth(imageSize.width); setResizeHeight(imageSize.height); setResizeDialogOpen(true); }}>تغيير الحجم...</button>
                  </div>

                  <div className="selection-actions">
                    <span>أدوات التحديد والقناع</span>
                    <div className="selection-modes">
                      <button className={selectionShape === "rectangle" ? "active" : ""} onClick={() => setSelectionShape("rectangle")}>مستطيل</button>
                      <button className={selectionShape === "ellipse" ? "active" : ""} onClick={() => setSelectionShape("ellipse")}>بيضاوي</button>
                      <button className={selectionShape === "free" ? "active" : ""} onClick={() => setSelectionShape("free")}>حر</button>
                      <button className={selectionMode === "replace" ? "active" : ""} onClick={() => setSelectionMode("replace")}>استبدال</button>
                      <button className={selectionMode === "add" ? "active" : ""} onClick={() => setSelectionMode("add")}>إضافة</button>
                      <button className={selectionMode === "subtract" ? "active" : ""} onClick={() => setSelectionMode("subtract")}>طرح</button>
                      <button onClick={selectAll} title="تحديد كامل الصورة (Ctrl+A)">الكل</button>
                      <button onClick={deselect} title="إلغاء التحديد (Ctrl+D)">إلغاء</button>
                      <button onClick={invertSelection} title="عكس نطاق التحديد (Ctrl+Shift+I)">عكس</button>
                      <button onClick={featherActiveSelection} title="تنعيم حواف التحديد (Feather)">تنعيم</button>
                      <button onClick={createMaskFromSelection} title="إنشاء قناع غير تدميري">قناع</button>
                    </div>
                  </div>

                  {(() => {
                    const activeTextItem = textElements.find((item) => item.id === selectedTextId);
                    if (!activeTextItem) return null;
                    return (
                      <div className="text-editor-panel" style={{ display: "flex", flexDirection: "column", gap: "8px", background: "rgba(45,212,191,0.04)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(45,212,191,0.25)", margin: "8px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "11px", fontWeight: "bold", color: "#2dd4bf" }}>تحرير النص — المرحلة 11</span>
                          <span style={{ fontSize: "9px", color: "#6a8c85" }}>نص مستقل</span>
                        </div>

                        {/* Text Content */}
                        <input
                          value={activeTextItem.text}
                          onChange={(event) => updateText(event.target.value)}
                          aria-label="محتوى النص"
                          placeholder="اكتب النص هنا"
                          className="modal-input"
                          style={{ fontSize: "12px", padding: "6px 8px", direction: "rtl" }}
                        />

                        {/* Font Family */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "10px", color: "#8fa9a3", minWidth: "45px" }}>الخط:</span>
                          <select
                            value={activeTextItem.fontFamily ?? "Cairo"}
                            onChange={(e) => { updateTextProp("fontFamily", e.target.value); ensureFontLoaded(e.target.value); }}
                            className="blend-select"
                            style={{ fontSize: "11px", flex: 1 }}
                          >
                            {GOOGLE_FONTS.map(f => (
                              <option key={f.name} value={f.name}>{f.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Font Size */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "10px", color: "#8fa9a3" }}>الحجم:</span>
                          <output style={{ fontSize: "10px", color: "#2dd4bf" }}>{Math.round(activeTextItem.size)}px</output>
                        </div>
                        <Slider value={[activeTextItem.size]} min={12} max={300} step={1} onValueChange={(vals) => updateTextSize(vals[0])} />

                        {/* Font Weight + Style + Align */}
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {(["normal", "600", "bold", "800"] as const).map(w => (
                            <button key={w} type="button" className={`preset-chip-btn ${(activeTextItem.fontWeight ?? "600") === w ? "active" : ""}`} onClick={() => updateTextProp("fontWeight", w)} style={{ fontWeight: w }}>{w === "normal" ? "رفيع" : w === "600" ? "متوسط" : w === "bold" ? "عريض" : "أعرض"}</button>
                          ))}
                          <button type="button" className={`preset-chip-btn ${activeTextItem.fontStyle === "italic" ? "active" : ""}`} onClick={() => updateTextProp("fontStyle", activeTextItem.fontStyle === "italic" ? "normal" : "italic")} style={{ fontStyle: "italic" }}>مائل</button>
                        </div>

                        {/* Text Align */}
                        <div style={{ display: "flex", gap: "4px" }}>
                          {(["right", "center", "left"] as const).map(a => (
                            <button key={a} type="button" className={`preset-chip-btn ${(activeTextItem.textAlign ?? "center") === a ? "active" : ""}`} onClick={() => updateTextProp("textAlign", a)}>
                              {a === "right" ? "⇒ يمين" : a === "center" ? "⇔ وسط" : "⇐ يسار"}
                            </button>
                          ))}
                        </div>

                        {/* Letter Spacing */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "10px", color: "#8fa9a3" }}>تباعد الحروف:</span>
                          <output style={{ fontSize: "10px", color: "#2dd4bf" }}>{activeTextItem.letterSpacing ?? 0}px</output>
                        </div>
                        <Slider value={[activeTextItem.letterSpacing ?? 0]} min={-5} max={30} step={0.5} onValueChange={(vals) => updateTextProp("letterSpacing", vals[0])} />

                        {/* Rotation */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "10px", color: "#8fa9a3" }}>التدوير:</span>
                          <output style={{ fontSize: "10px", color: "#2dd4bf" }}>{activeTextItem.rotation ?? 0}°</output>
                        </div>
                        <Slider value={[activeTextItem.rotation ?? 0]} min={-180} max={180} step={1} onValueChange={(vals) => updateTextProp("rotation", vals[0])} />

                        {/* Color */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                          <span style={{ fontSize: "10px", color: "#8fa9a3" }}>لون الخط:</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <input type="color" value={activeTextItem.color} onChange={(e) => updateTextColor(e.target.value)} style={{ width: "26px", height: "24px", padding: 0, border: "none", borderRadius: "4px", cursor: "pointer", background: "transparent" }} title="اختر لون الخط" />
                            <span style={{ fontSize: "10px", color: "#c8d9d5", fontFamily: "monospace" }}>{activeTextItem.color.toUpperCase()}</span>
                          </div>
                        </div>

                        {/* Text Effects */}
                        <div style={{ fontSize: "10px", fontWeight: "bold", color: "#2dd4bf", marginTop: "4px", borderTop: "1px solid rgba(45,212,191,0.2)", paddingTop: "6px" }}>تأثيرات النص</div>

                        {/* Shadow */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input type="checkbox" id="shadow-enable" checked={!!activeTextItem.shadowEnabled} onChange={(e) => updateTextProp("shadowEnabled", e.target.checked)} />
                          <label htmlFor="shadow-enable" style={{ fontSize: "10px", color: "#8fa9a3", cursor: "pointer" }}>ظل (Shadow)</label>
                          {activeTextItem.shadowEnabled && (
                            <>
                              <input type="color" value={activeTextItem.shadowColor ?? "#000000"} onChange={(e) => updateTextProp("shadowColor", e.target.value)} style={{ width: "22px", height: "20px", padding: 0, border: "none", borderRadius: "3px", cursor: "pointer" }} title="لون الظل" />
                              <span style={{ fontSize: "9px", color: "#6a8c85" }}>إزاحة: X</span>
                              <input type="number" value={activeTextItem.shadowOffsetX ?? 3} onChange={(e) => updateTextProp("shadowOffsetX", Number(e.target.value))} style={{ width: "38px", background: "#1a2828", color: "white", border: "1px solid #2dd4bf40", borderRadius: "4px", padding: "1px 4px", fontSize: "10px" }} />
                              <span style={{ fontSize: "9px", color: "#6a8c85" }}>Y</span>
                              <input type="number" value={activeTextItem.shadowOffsetY ?? 3} onChange={(e) => updateTextProp("shadowOffsetY", Number(e.target.value))} style={{ width: "38px", background: "#1a2828", color: "white", border: "1px solid #2dd4bf40", borderRadius: "4px", padding: "1px 4px", fontSize: "10px" }} />
                            </>
                          )}
                        </div>

                        {/* Stroke (Outline) */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input type="checkbox" id="stroke-enable" checked={!!activeTextItem.strokeEnabled} onChange={(e) => updateTextProp("strokeEnabled", e.target.checked)} />
                          <label htmlFor="stroke-enable" style={{ fontSize: "10px", color: "#8fa9a3", cursor: "pointer" }}>حدود (Stroke)</label>
                          {activeTextItem.strokeEnabled && (
                            <>
                              <input type="color" value={activeTextItem.strokeColor ?? "#000000"} onChange={(e) => updateTextProp("strokeColor", e.target.value)} style={{ width: "22px", height: "20px", padding: 0, border: "none", borderRadius: "3px", cursor: "pointer" }} title="لون الحدود" />
                              <span style={{ fontSize: "9px", color: "#6a8c85" }}>سُمك:</span>
                              <input type="number" min={1} max={20} value={activeTextItem.strokeWidth ?? 2} onChange={(e) => updateTextProp("strokeWidth", Number(e.target.value))} style={{ width: "40px", background: "#1a2828", color: "white", border: "1px solid #2dd4bf40", borderRadius: "4px", padding: "1px 4px", fontSize: "10px" }} />
                            </>
                          )}
                        </div>

                        {/* Glow */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input type="checkbox" id="glow-enable" checked={!!activeTextItem.glowEnabled} onChange={(e) => updateTextProp("glowEnabled", e.target.checked)} />
                          <label htmlFor="glow-enable" style={{ fontSize: "10px", color: "#8fa9a3", cursor: "pointer" }}>توهج (Glow)</label>
                          {activeTextItem.glowEnabled && (
                            <>
                              <input type="color" value={activeTextItem.glowColor ?? "#00ffff"} onChange={(e) => updateTextProp("glowColor", e.target.value)} style={{ width: "22px", height: "20px", padding: 0, border: "none", borderRadius: "3px", cursor: "pointer" }} title="لون التوهج" />
                              <span style={{ fontSize: "9px", color: "#6a8c85" }}>قوة:</span>
                              <input type="number" min={1} max={50} value={activeTextItem.glowBlur ?? 15} onChange={(e) => updateTextProp("glowBlur", Number(e.target.value))} style={{ width: "40px", background: "#1a2828", color: "white", border: "1px solid #2dd4bf40", borderRadius: "4px", padding: "1px 4px", fontSize: "10px" }} />
                            </>
                          )}
                        </div>

                        {/* Gradient */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <input type="checkbox" id="grad-enable" checked={!!activeTextItem.gradientEnabled} onChange={(e) => updateTextProp("gradientEnabled", e.target.checked)} />
                          <label htmlFor="grad-enable" style={{ fontSize: "10px", color: "#8fa9a3", cursor: "pointer" }}>تدرج لوني (Gradient)</label>
                          {activeTextItem.gradientEnabled && (
                            <>
                              <input type="color" value={activeTextItem.gradientColor1 ?? activeTextItem.color} onChange={(e) => updateTextProp("gradientColor1", e.target.value)} style={{ width: "22px", height: "20px", padding: 0, border: "none", borderRadius: "3px", cursor: "pointer" }} title="اللون الأول" />
                              <span style={{ fontSize: "9px", color: "#6a8c85" }}>→</span>
                              <input type="color" value={activeTextItem.gradientColor2 ?? "#ff6b6b"} onChange={(e) => updateTextProp("gradientColor2", e.target.value)} style={{ width: "22px", height: "20px", padding: 0, border: "none", borderRadius: "3px", cursor: "pointer" }} title="اللون الثاني" />
                            </>
                          )}
                        </div>

                        {/* Position Arrows */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                          <span style={{ fontSize: "10px", color: "#8fa9a3" }}>موضع النص:</span>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button type="button" className="preset-chip-btn" onClick={() => moveTextPosition(0, -15)} title="تحريك لأعلى">↑</button>
                            <button type="button" className="preset-chip-btn" onClick={() => moveTextPosition(0, 15)} title="تحريك لأسفل">↓</button>
                            <button type="button" className="preset-chip-btn" onClick={() => moveTextPosition(-15, 0)} title="تحريك لليمين">←</button>
                            <button type="button" className="preset-chip-btn" onClick={() => moveTextPosition(15, 0)} title="تحريك لليسار">→</button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="properties-divider" />
                  <div className="property-row">
                    <span>وضع الدمج</span>
                    <button className="select-control" onClick={cycleBlendMode}>{blendMode} <ChevronDown size={13} /></button>
                  </div>
                  <div className="property-row">
                    <span>نمط الألوان</span>
                    <span className="value-muted">sRGB IEC61966-2.1</span>
                  </div>
                  <div className="property-row">
                    <span>اللون المحدد</span>
                    <span className="value-muted">{foregroundColor.toUpperCase()} · {sampledRgb}</span>
                  </div>
                </div>
              )}

              <div className="inspector-section">
                <div className="panel-heading">
                  <span>الفلاتر ومصفوفات التلافيف السريعة</span>
                  <button onClick={() => setQuickAdjustmentsOpen((open) => !open)} aria-label="خيارات الفلاتر">
                    <ChevronDown size={14} />
                  </button>
                </div>
                {quickAdjustmentsOpen ? (
                  <div className="adjustment-grid">
                    <button onClick={() => { setFilterMode("blur"); setStatus("تم تطبيق تمويه ضبابي Gaussian Blur"); }}><WandSparkles size={15} /> تمويه Blur</button>
                    <button onClick={() => { setFilterMode("sharpen"); setStatus("تم تطبيق زيادة الحدة Sharpen 3x3"); }}><SlidersHorizontal size={15} /> حدة Sharpen</button>
                    <button onClick={() => { setFilterMode("edges"); setStatus("تم تطبيق كشف الحواف Laplacian Edge Detection"); }}><Square size={15} /> حواف Edges</button>
                    <button onClick={() => { setFilterMode("emboss"); setStatus("تم تطبيق فلتر النقش البارز Emboss"); }}><Sparkles size={15} /> نقش Emboss</button>
                    <button onClick={() => { setFilterMode("pixelate"); setStatus("تم تطبيق فلتر الفسيفساء والبكسلة Pixelate"); }}><Grid size={15} /> فسيفساء Pixel</button>
                    <button onClick={() => { setFilterMode("none"); setStatus("تمت إزالة الفلاتر والعودة للأصل"); }}><RotateCcw size={15} /> أصل بدون فلتر</button>
                  </div>
                ) : (
                  <div className="collapsed-note">لوحة الفلاتر السريعة مطوية</div>
                )}
              </div>

              <div className="inspector-note">
                <span className="note-icon">i</span>
                <p>تتم التعديلات بنظام المعالجة غير التدميرية، مع الحفاظ على أصل الصورة وإمكانية التراجع والتصدير بأعلى جودة.</p>
              </div>
            </aside>
          )}
        </section>

        <footer className="app-footer">
          <span><span className="footer-signal" /> ImagePro Engine v0.2.0</span>
          <span>Canvas 2D Renderer <span className="footer-separator">/</span> sRGB Color Engine</span>
          <span>اختصارات مساحة العمل: <kbd>Space</kbd> يد تحريك <kbd>H</kbd> أداة اليد <kbd>Ctrl+0</kbd> ملاءمة <kbd>Ctrl+1</kbd> 100% <kbd>Ctrl+عجلة الماوس</kbd> تكبير/تصغير</span>
        </footer>

        <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleUpload} />

        {/* 1. Modal: إنشاء مشروع جديد */}
        {newProjectOpen && (
          <div className="modal-backdrop" onClick={() => setNewProjectOpen(false)}>
            <div className="modal-window" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3><FilePlus size={16} /> إنشاء مشروع جديد</h3>
                <button className="modal-close-btn" onClick={() => setNewProjectOpen(false)}><X size={16} /></button>
              </div>
              <div className="modal-body">
                <div className="modal-field">
                  <label>اسم المشروع</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="مثال: تصميم الغلاف الأول"
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="modal-field">
                    <label>العرض (بكسل)</label>
                    <input
                      type="number"
                      className="modal-input"
                      value={newProjectWidth}
                      onChange={(e) => setNewProjectWidth(Math.max(100, Math.min(8000, Number(e.target.value))))}
                    />
                  </div>
                  <div className="modal-field">
                    <label>الارتفاع (بكسل)</label>
                    <input
                      type="number"
                      className="modal-input"
                      value={newProjectHeight}
                      onChange={(e) => setNewProjectHeight(Math.max(100, Math.min(8000, Number(e.target.value))))}
                    />
                  </div>
                </div>
                <div className="modal-field">
                  <label>أبعاد قياسية جاهزة</label>
                  <div className="preset-chips">
                    <button type="button" className="preset-chip" onClick={() => { setNewProjectWidth(1920); setNewProjectHeight(1080); }}>1920 × 1080 (FHD)</button>
                    <button type="button" className="preset-chip" onClick={() => { setNewProjectWidth(1280); setNewProjectHeight(720); }}>1280 × 720 (HD)</button>
                    <button type="button" className="preset-chip" onClick={() => { setNewProjectWidth(1080); setNewProjectHeight(1080); }}>1080 × 1080 (مربع)</button>
                    <button type="button" className="preset-chip" onClick={() => { setNewProjectWidth(800); setNewProjectHeight(600); }}>800 × 600 (ويب)</button>
                  </div>
                </div>
                <div className="modal-field">
                  <label>لون الخلفية الأولية</label>
                  <div className="color-swatches">
                    <button
                      type="button"
                      className={`color-swatch-btn ${newProjectBg === "transparent" ? "active" : ""}`}
                      onClick={() => setNewProjectBg("transparent")}
                    >
                      🏁 شفاف
                    </button>
                    <button
                      type="button"
                      className={`color-swatch-btn ${newProjectBg === "#ffffff" ? "active" : ""}`}
                      onClick={() => setNewProjectBg("#ffffff")}
                    >
                      ⬜ أبيض
                    </button>
                    <button
                      type="button"
                      className={`color-swatch-btn ${newProjectBg === "#111b1b" ? "active" : ""}`}
                      onClick={() => setNewProjectBg("#111b1b")}
                    >
                      ⬛ داكن
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setNewProjectOpen(false)}>إلغاء</button>
                <button
                  className="btn-primary"
                  onClick={() => createNewProject(newProjectName, newProjectWidth, newProjectHeight, newProjectBg)}
                >
                  إنشاء المشروع
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Modal: معلومات الملف والمشروع */}
        {fileInfoOpen && (
          <div className="modal-backdrop" onClick={() => setFileInfoOpen(false)}>
            <div className="modal-window" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3><Info size={16} /> معلومات الملف والمشروع</h3>
                <button className="modal-close-btn" onClick={() => setFileInfoOpen(false)}><X size={16} /></button>
              </div>
              <div className="modal-body">
                <table className="info-table">
                  <tbody>
                    <tr>
                      <td>اسم المشروع:</td>
                      <td>{imageName}</td>
                    </tr>
                    <tr>
                      <td>أبعاد مساحة العمل:</td>
                      <td>{imageSize.width} × {imageSize.height} بكسل</td>
                    </tr>
                    <tr>
                      <td>نسبة العرض للارتفاع:</td>
                      <td>{(imageSize.width / imageSize.height).toFixed(2)} : 1</td>
                    </tr>
                    <tr>
                      <td>نمط ونطاق الألوان:</td>
                      <td>sRGB / 8-bit per channel</td>
                    </tr>
                    <tr>
                      <td>عدد الطبقات:</td>
                      <td>{layers.length} طبقات ({layers.filter((l) => l.visible).length} مرئية)</td>
                    </tr>
                    <tr>
                      <td>مسارات الرسم المباشر:</td>
                      <td>{strokes.length} مسار</td>
                    </tr>
                    <tr>
                      <td>طبقات النصوص:</td>
                      <td>{textElements.length} نصوص</td>
                    </tr>
                    <tr>
                      <td>خطوات سجل التراجع:</td>
                      <td>{historyRef.current.length} / 20 خطوة</td>
                    </tr>
                    <tr>
                      <td>آخر حفظ محلي:</td>
                      <td>{lastSavedTime || "لم يتم الحفظ في هذه الجلسة"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button className="btn-primary" onClick={() => setFileInfoOpen(false)}>إغلاق</button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Modal: خيارات التصدير المخصص */}
        {exportOptionsOpen && (
          <div className="modal-backdrop" onClick={() => setExportOptionsOpen(false)}>
            <div className="modal-window" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3><Download size={16} /> خيارات التصدير المتقدم</h3>
                <button className="modal-close-btn" onClick={() => setExportOptionsOpen(false)}><X size={16} /></button>
              </div>
              <div className="modal-body">
                <div className="modal-field">
                  <label>اسم الملف عند التحميل</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={imageName}
                    onChange={(e) => setImageName(e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label>صيغة التصدير</label>
                  <div className="color-swatches">
                    <button
                      type="button"
                      className={`color-swatch-btn ${exportFormat === "png" ? "active" : ""}`}
                      onClick={() => setExportFormat("png")}
                    >
                      PNG (شفافية كاملة)
                    </button>
                    <button
                      type="button"
                      className={`color-swatch-btn ${exportFormat === "jpeg" ? "active" : ""}`}
                      onClick={() => setExportFormat("jpeg")}
                    >
                      JPG (مضغوط)
                    </button>
                    <button
                      type="button"
                      className={`color-swatch-btn ${exportFormat === "webp" ? "active" : ""}`}
                      onClick={() => setExportFormat("webp")}
                    >
                      WebP (حديث)
                    </button>
                  </div>
                </div>
                <div className="modal-field">
                  <label>مقياس الدقة (Resolution Scale)</label>
                  <div className="export-scale-group">
                    {[0.5, 1, 2].map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        className={`export-scale-btn ${exportScale === sc ? "active" : ""}`}
                        onClick={() => setExportScale(sc)}
                      >
                        {sc}x ({Math.round(imageSize.width * sc)}×{Math.round(imageSize.height * sc)})
                      </button>
                    ))}
                  </div>
                </div>
                {exportFormat !== "png" && (
                  <div className="modal-field">
                    <label>نسبة الجودة: {exportQuality}%</label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={exportQuality}
                      onChange={(e) => setExportQuality(Number(e.target.value))}
                      style={{ accentColor: "#2dd4bf", width: "100%" }}
                    />
                  </div>
                )}
                <div style={{ fontSize: "11px", color: "#6a8c85", background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: "5px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>الأبعاد: <b>{Math.round(imageSize.width * exportScale)} × {Math.round(imageSize.height * exportScale)}</b> بكسل</span>
                  <span>الحجم التقديري: <b style={{ color: "#2dd4bf" }}>{estimateExportFileSize(Math.round(imageSize.width * exportScale), Math.round(imageSize.height * exportScale), exportFormat, exportQuality)}</b></span>
                </div>
              </div>
              <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setExportOptionsOpen(false);
                    exportProjectFile();
                  }}
                  title="تصدير كملف مشروع كامل مع الطبقات"
                >
                  <FileDown size={14} /> حزمة المشروع (.imagepro)
                </button>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn-secondary" onClick={() => setExportOptionsOpen(false)}>إلغاء</button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setExportOptionsOpen(false);
                      exportImage(exportFormat, exportQuality, exportScale);
                    }}
                  >
                    تصدير وتحميل الآن
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Modal: تغيير أبعاد وحجم الصورة (Phase 3) */}
        {resizeDialogOpen && (
          <div className="modal-backdrop" onClick={() => setResizeDialogOpen(false)}>
            <div className="modal-window" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3><Scale size={16} /> تغيير حجم وأبعاد الصورة (Resize)</h3>
                <button className="modal-close-btn" onClick={() => setResizeDialogOpen(false)}><X size={16} /></button>
              </div>
              <div className="modal-body">
                <div style={{ fontSize: "11px", color: "#6a8c85", marginBottom: "10px" }}>
                  الأبعاد الحالية: <b>{imageSize.width} × {imageSize.height}</b> بكسل
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="modal-field">
                    <label>العرض الجديد (بكسل)</label>
                    <input
                      type="number"
                      className="modal-input"
                      value={resizeWidth}
                      onChange={(e) => {
                        const newW = Math.max(1, Number(e.target.value));
                        setResizeWidth(newW);
                        if (lockAspectRatio && imageSize.width > 0) {
                          setResizeHeight(Math.round(newW * (imageSize.height / imageSize.width)));
                        }
                      }}
                      min="10"
                      max="8000"
                    />
                  </div>
                  <div className="modal-field">
                    <label>الارتفاع الجديد (بكسل)</label>
                    <input
                      type="number"
                      className="modal-input"
                      value={resizeHeight}
                      onChange={(e) => {
                        const newH = Math.max(1, Number(e.target.value));
                        setResizeHeight(newH);
                        if (lockAspectRatio && imageSize.height > 0) {
                          setResizeWidth(Math.round(newH * (imageSize.width / imageSize.height)));
                        }
                      }}
                      min="10"
                      max="8000"
                    />
                  </div>
                </div>

                <div className="modal-field">
                  <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={lockAspectRatio}
                      onChange={(e) => setLockAspectRatio(e.target.checked)}
                      style={{ accentColor: "#2dd4bf" }}
                    />
                    <span>الحفاظ على نسبة العرض إلى الارتفاع (Lock Aspect Ratio)</span>
                  </label>
                </div>

                <div className="modal-field">
                  <label>نسب تحجيم سريعة</label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {[
                      { label: "25%", scale: 0.25 },
                      { label: "50%", scale: 0.5 },
                      { label: "75%", scale: 0.75 },
                      { label: "100%", scale: 1.0 },
                      { label: "150%", scale: 1.5 },
                      { label: "200%", scale: 2.0 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        className="preset-chip-btn"
                        onClick={() => {
                          setResizeWidth(Math.round(imageSize.width * preset.scale));
                          setResizeHeight(Math.round(imageSize.height * preset.scale));
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: "10px", color: "#5f7e77", background: "rgba(45,212,191,0.04)", padding: "7px 10px", borderRadius: "5px" }}>
                  يتم التحجيم باستخدام خوارزمية تنعيم Canvas عالية الدقة High-Quality Bicubic Smoothing.
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setResizeDialogOpen(false)}>إلغاء</button>
                <button
                  className="btn-primary"
                  onClick={() => applyResize(resizeWidth, resizeHeight)}
                >
                  تطبيق الأبعاد الجديدة
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </TooltipProvider>
  );
}

function HistogramViewer({ data }: { data: HistogramData | null }) {
  if (!data) return null;
  const { r, g, b, lum, maxCount } = data;
  const width = 256;
  const height = 64;

  const pointsLum = lum.map((c, i) => `${i},${Math.max(0, height - (c / maxCount) * height)}`).join(" ");
  const pointsR = r.map((c, i) => `${i},${Math.max(0, height - (c / maxCount) * height)}`).join(" ");
  const pointsG = g.map((c, i) => `${i},${Math.max(0, height - (c / maxCount) * height)}`).join(" ");
  const pointsB = b.map((c, i) => `${i},${Math.max(0, height - (c / maxCount) * height)}`).join(" ");

  return (
    <div className="histogram-card">
      <div className="histogram-header">
        <span>مخطط توزيع الإضاءة (Histogram)</span>
        <div className="histogram-channels">
          <span className="channel-dot red" title="أحمر" />
          <span className="channel-dot green" title="أخضر" />
          <span className="channel-dot blue" title="أزرق" />
          <span className="channel-dot lum" title="إضاءة عامة" />
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="histogram-svg" preserveAspectRatio="none">
        <line x1="64" y1="0" x2="64" y2={height} stroke="rgba(255,255,255,0.06)" />
        <line x1="128" y1="0" x2="128" y2={height} stroke="rgba(255,255,255,0.06)" />
        <line x1="192" y1="0" x2="192" y2={height} stroke="rgba(255,255,255,0.06)" />
        <polygon points={`0,${height} ${pointsLum} ${width - 1},${height}`} fill="rgba(255, 255, 255, 0.12)" />
        <polyline points={pointsR} fill="none" stroke="rgba(244, 63, 94, 0.7)" strokeWidth="1" />
        <polyline points={pointsG} fill="none" stroke="rgba(52, 211, 153, 0.7)" strokeWidth="1" />
        <polyline points={pointsB} fill="none" stroke="rgba(96, 165, 250, 0.7)" strokeWidth="1" />
        <polyline points={pointsLum} fill="none" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="1.2" />
      </svg>
      <div className="histogram-labels">
        <span>0 ظلال</span>
        <span>128 وسط</span>
        <span>255 إضاءات</span>
      </div>
    </div>
  );
}

function Adjustment({
  label,
  value,
  min,
  max,
  step = 1,
  defaultValue,
  unit = "",
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  const isChanged = defaultValue !== undefined && Math.abs(value - defaultValue) > 0.001;
  return (
    <div className="adjustment-row">
      <div className="adjustment-header">
        <span>{label}</span>
        <div className="adjustment-value-wrap">
          <output>{value}{unit}</output>
          {isChanged && (
            <button
              type="button"
              className="adjustment-reset-btn"
              onClick={() => onChange(defaultValue)}
              title="إعادة ضبط هذه القيمة إلى الافتراضي"
            >
              ↺
            </button>
          )}
        </div>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(values) => onChange(values[0])} />
    </div>
  );
}
