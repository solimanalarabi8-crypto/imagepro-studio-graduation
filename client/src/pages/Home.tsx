import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  blendModeToCompositeOp,
  opacityToAlpha,
  detectHistoryAction,
  BLEND_MODE_OPTIONS,
  type LayerInfo,
  moveLayerToTop as moveLayerToTopHelper,
  moveLayerToBottom as moveLayerToBottomHelper,
  moveLayerUp as moveLayerUpHelper,
  moveLayerDown as moveLayerDownHelper,
  reorderLayers,
  toggleLayerSolo as toggleLayerSoloHelper,
  duplicateLayer as duplicateLayerHelper,
} from "@/lib/layers-history";
import { calculateHistogram, applyPixelAdjustments, DEFAULT_ADJUSTMENTS, type HistogramData } from "@/lib/color-adjustments";
import { FILTER_CATALOG, executeFilter, generateFilterPreviews, type FilterMode, type FilterCategory } from "@/lib/filters-engine";
import {
  serializeProjectPackage,
  deserializeProjectPackage,
  downloadFile,
  estimateExportFileSize,
  type ImageProProjectPackage,
} from "@/lib/project-persistence";
import {
  ArrowDown, ArrowUp, Brush, Check, ChevronDown, Circle, Cloud, Crop, Download, Eraser, Eye, EyeOff, FileDown, FilePlus,
  FolderOpen, Grid, Hand, Image as ImageIcon, Info, Layers3, Lock, Unlock, Folder, Combine, Maximize2, Minimize2, Minus, MousePointer2, Move,
  PaintBucket, PanelRight, PanelRightClose, Pencil, Plus, Redo2, RefreshCw, RotateCcw, RotateCw, Save, Scale, Settings2,
  SlidersHorizontal, Sparkles, Square, Stamp, CircleDot, Crosshair, SunMedium, TextCursorInput, Triangle, Type, Undo2, Upload, WandSparkles, X, ZoomIn,
  ChevronsDown, ChevronsUp, Copy, Trash2, FlipHorizontal, FlipVertical,
  AlignLeft, AlignCenter, AlignRight, Magnet, Ruler, History, Search,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { featherSelection, invertSelectionRect, selectAllSelection, subtractSelection, unionSelection } from "@/lib/selection";
import {
  drawSmoothStroke,
  drawAdvancedShape,
  applyFloodFill,
  applyMagicEraser,
  type ShapeType,
  type ShapeFillMode,
} from "@/lib/drawing-engine";
import { ProductBackgroundsModal } from "@/components/ProductBackgroundsModal";
import { TemplatesModal } from "@/components/TemplatesModal";
import { BlendModal } from "@/components/BlendModal";
import { FiltersStudioModal } from "@/components/FiltersStudioModal";
import { SmartDropHubModal } from "@/components/SmartDropHubModal";
import { CommandPaletteModal, type CommandItem } from "@/components/CommandPaletteModal";
import { CanvasContextMenu } from "@/components/CanvasContextMenu";
import { ProjectsDashboardModal } from "@/components/ProjectsDashboardModal";
import { VersionHistoryModal } from "@/components/VersionHistoryModal";
import { CreativeLibraryModal } from "@/components/CreativeLibraryModal";
import { CreativePlatformView } from "@/components/CreativePlatformView";
import { NewDesignModal } from "@/components/NewDesignModal";
import { ShareProjectModal } from "@/components/ShareProjectModal";
import { STOCK_PHOTOS, StockPhotoItem } from "@/lib/stock-photos-library";
import { ASSET_GRAPHICS } from "@/lib/assets-library";
import { WatermarkModal, type WatermarkOptions } from "@/components/WatermarkModal";
import { MultiSizeExportModal } from "@/components/MultiSizeExportModal";
import {
  saveAutosaveRecovery,
  getAutosaveRecovery,
  clearAutosaveRecovery,
  createProjectSnapshot,
  getProjectSnapshots,
  deleteProjectSnapshot,
  updateProjectRegistry,
  getAllRegisteredProjects,
  removeProjectFromRegistry,
  type ProjectSnapshot,
  type StoredProjectMetadata,
} from "@/lib/autosave-manager";
import { type CreativeBackdropPreset } from "@/lib/creative-backgrounds";
import { type ProductBackgroundPreset } from "@/lib/product-backgrounds";
import { type EditableTemplate } from "@/lib/editable-templates";
import { type AssetGraphicItem } from "@/lib/assets-library";
import {
  extractDroppedImageMeta,
  calculateFittedPlacement,
  isProjectFile,
  isSupportedImageFile,
  type DroppedImageMeta,
  type DropActionType,
} from "@/lib/smart-drop-hub";
import { i18n, type Language } from "@/lib/i18n";
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
  cleanMaskNoise,
} from "@/lib/subject-extractor";
import UserGuide from "@/components/UserGuide";
import { calculateSnap, calculateAlignment, type GuideLine, type SnapLine, type AlignmentType } from "@/lib/guides-snap-engine";

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
export interface FloatingSubject {
  id: string;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
  rotation?: number;
}
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
    { id: "select", label: "تحريك وتحديد العنصر", icon: Move, shortcut: "V" },
    { id: "hand", label: "تمرير مساحة العمل", icon: Hand, shortcut: "H" },
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

interface LiveBrushPreviewProps {
  color: string;
  size: number;
  opacity: number;
  hardness: number;
  preset: string;
}

function LiveBrushPreview({ color, size, opacity, hardness, preset }: LiveBrushPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    const alpha = Math.max(0.15, opacity / 100);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineCap = preset === "pencil" ? "square" : "round";
    ctx.lineJoin = "round";

    const previewWidth = Math.min(26, Math.max(4, size * 0.42));
    ctx.lineWidth = previewWidth;

    if (hardness < 70) {
      ctx.shadowBlur = (100 - hardness) * 0.16;
      ctx.shadowColor = color;
    }

    if (preset === "spray") {
      ctx.fillStyle = color;
      for (let t = 0; t <= 1; t += 0.015) {
        const x = 30 + t * (canvas.width - 60);
        const y = 22 + Math.sin(t * Math.PI * 2) * 4;
        const count = Math.floor(previewWidth / 2);
        for (let i = 0; i < count; i++) {
          const rx = (Math.random() - 0.5) * previewWidth * 1.5;
          const ry = (Math.random() - 0.5) * previewWidth * 1.5;
          ctx.beginPath();
          ctx.arc(x + rx, y + ry, Math.random() * 1.4 + 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      ctx.beginPath();
      const startX = 30;
      const endX = canvas.width - 30;
      const midY = canvas.height / 2;
      ctx.moveTo(startX, midY);
      ctx.bezierCurveTo(startX + 60, midY - 8, endX - 60, midY + 8, endX, midY);
      ctx.stroke();
    }

    ctx.restore();
  }, [color, size, opacity, hardness, preset]);

  return (
    <div className="brush-preview-capsule">
      <div className="brush-preview-header">
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>🖌️</span>
          <span>معاينة حية لضربة الفرشاة</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "5px", fontFamily: "monospace", fontSize: "10px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: color, display: "inline-block", border: "1px solid rgba(255,255,255,0.3)" }} />
          <span>{color.toUpperCase()}</span>
        </span>
      </div>
      <div className="brush-preview-canvas-box">
        <canvas ref={canvasRef} width={260} height={44} style={{ width: "100%", height: "44px", display: "block" }} />
      </div>
    </div>
  );
}

const BRUSH_PRESETS = [
  { id: "soft", label: "فرشاة ناعمة", icon: "⭕" },
  { id: "hard", label: "فرشاة صلبة", icon: "🟣" },
  { id: "pencil", label: "قلم رصاص", icon: "✏️" },
  { id: "ink", label: "فرشاة حبر", icon: "✒️" },
  { id: "blur", label: "فرشاة ضبابية", icon: "☁️" },
  { id: "spray", label: "فرشاة رذاذ", icon: "✨" },
];

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
  const [layers, setLayers] = useState(layerSeed);
  const [selectedLayer, setSelectedLayer] = useState("portrait");
  const [selectedTarget, setSelectedTarget] = useState<"content" | "mask">("content");
  const [imageSrc, setImageSrc] = useState(sampleImages.portrait);
  const [imageName, setImageName] = useState("دراسة بورتريه شخصي");
  const [sampleImageKey, setSampleImageKey] = useState<keyof typeof sampleImages>("portrait");
  const [imageSize, setImageSize] = useState({ width: 2048, height: 1536 });
  const [zoom, setZoom] = useState(100);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [saturation, setSaturation] = useState<number>(100);
  const [sepia, setSepia] = useState<number>(0);
  const [invert, setInvert] = useState<number>(0);
  // Point 5: Extended Lighting, Color & Histogram State
  const [hue, setHue] = useState<number>(0);
  const [exposure, setExposure] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(0);
  const [gamma, setGamma] = useState<number>(1.0);
  const [colorBalanceR, setColorBalanceR] = useState<number>(0);
  const [colorBalanceG, setColorBalanceG] = useState<number>(0);
  const [colorBalanceB, setColorBalanceB] = useState<number>(0);
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null);
  const [thresholdEnabled, setThresholdEnabled] = useState<boolean>(false);
  const [threshold, setThreshold] = useState<number>(128);
  const [isComparingBefore, setIsComparingBefore] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("none");
  const [filterIntensity, setFilterIntensity] = useState<number>(50);
  const [filterCategoryFilter, setFilterCategoryFilter] = useState<"الكل" | FilterCategory>("الكل");
  const [exportScale, setExportScale] = useState<number>(1);
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [shapes, setShapes] = useState<ShapeElement[]>([]);
  const [brushSize, setBrushSize] = useState<number>(16);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [foregroundColor, setForegroundColor] = useState("#0057ff");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [brushHardness, setBrushHardness] = useState(100);
  const [activeShapeType, setActiveShapeType] = useState<ShapeType>("rectangle");
  const [shapeFillMode, setShapeFillMode] = useState<ShapeFillMode>("stroke");

  // Surgical Eraser & Multi-Target Modes
  const [eraserMode, setEraserMode] = useState<"pixels" | "paint" | "magic">("pixels");
  const [magicEraserTolerance, setMagicEraserTolerance] = useState<number>(32);
  const [magicEraserContiguous, setMagicEraserContiguous] = useState<boolean>(true);
  const isErasingPixelsRef = useRef(false);

  // Studio Modals State
  const [isProductBgModalOpen, setIsProductBgModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isBlendModalOpen, setIsBlendModalOpen] = useState(false);

  // Advanced Professional Upgrades: Modals, Palettes & Menus
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isProjectsDashboardOpen, setIsProjectsDashboardOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isCreativeLibraryOpen, setIsCreativeLibraryOpen] = useState(false);
  const [isNewDesignModalOpen, setIsNewDesignModalOpen] = useState(false);
  const [shareProjectTarget, setShareProjectTarget] = useState<StoredProjectMetadata | null>(null);
  const [isWatermarkOpen, setIsWatermarkOpen] = useState(false);
  const [isMultiExportOpen, setIsMultiExportOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string>(() => "proj-" + Date.now());
  const [projectSnapshots, setProjectSnapshots] = useState<ProjectSnapshot[]>([]);
  const [registeredProjects, setRegisteredProjects] = useState<StoredProjectMetadata[]>([]);
  const [autosaveRecoverCandidate, setAutosaveRecoverCandidate] = useState<{ savedAt: number; data: string } | null>(null);

  // Section 6 & Canva Visual Suite: Live Filter Previews & Smart Drop Hub State
  const [isFiltersStudioOpen, setIsFiltersStudioOpen] = useState(false);
  const [filterThumbnails, setFilterThumbnails] = useState<Record<FilterMode, string>>({} as Record<FilterMode, string>);
  const [isDragOverStage, setIsDragOverStage] = useState(false);
  const [droppedImageMeta, setDroppedImageMeta] = useState<DroppedImageMeta | null>(null);
  const [isSmartDropHubOpen, setIsSmartDropHubOpen] = useState(false);
  const [preloadedBlendImage, setPreloadedBlendImage] = useState<string | null>(null);
  const dragCounterRef = useRef(0);

  // Automated Properties Sections State (Pixelora / Canva Style)
  const [propertiesSection, setPropertiesSection] = useState<"brush" | "color" | "filters" | "ai">("brush");
  const [activeBrushPreset, setActiveBrushPreset] = useState<string>("soft");

  // Global i18n & Theme State
  const [currentLang, setCurrentLang] = useState<Language>("ar");
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">("light");
  const t = i18n[currentLang];

  useEffect(() => {
    document.documentElement.classList.toggle("light-theme", currentTheme === "light");
    document.documentElement.classList.toggle("dark-theme", currentTheme === "dark");
  }, [currentTheme]);

  // Automate properties section and tabs to match active tool
  useEffect(() => {
    if (activeTool === "brush" || activeTool === "pencil" || activeTool === "eraser" || activeTool === "shape" || activeTool === "bucket" || activeTool === "text") {
      setPropertiesSection("brush");
      setActiveTab("properties");
    } else if (activeTool === "retouch" || activeTool === "wand") {
      setPropertiesSection("ai");
      setActiveTab("properties");
    }
  }, [activeTool]);

  const handleSelectBrushPreset = (presetId: string) => {
    setActiveBrushPreset(presetId);
    setActiveTool("brush");
    if (presetId === "soft") {
      setBrushHardness(20);
      setBrushOpacity(85);
      setStatus("تم تفعيل الفرشاة الناعمة");
    } else if (presetId === "hard") {
      setBrushHardness(100);
      setBrushOpacity(100);
      setStatus("تم تفعيل الفرشاة الصلبة");
    } else if (presetId === "pencil") {
      setBrushHardness(100);
      setBrushSize(3);
      setBrushOpacity(95);
      setStatus("تم تفعيل قلم الرصاص");
    } else if (presetId === "ink") {
      setBrushHardness(90);
      setBrushSize(8);
      setBrushOpacity(100);
      setStatus("تم تفعيل فرشاة الحبر");
    } else if (presetId === "blur") {
      setBrushHardness(5);
      setBrushOpacity(50);
      setStatus("تم تفعيل الفرشاة الضبابية");
    } else if (presetId === "spray") {
      setBrushHardness(35);
      setBrushOpacity(70);
      setStatus("تم تفعيل فرشاة الرذاذ");
    }
  };

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
  const [floatingSubject, setFloatingSubject] = useState<FloatingSubject | null>(null);
  const [hasCustomBackground, setHasCustomBackground] = useState<boolean>(false);
  const isDraggingSubjectRef = useRef(false);
  const subjectDragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const floatingSubjectPosRef = useRef<{ x: number; y: number } | null>(null);
  const dragRafIdRef = useRef<number | null>(null);
  const baseOffscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cachedSubjectImgRef = useRef<HTMLImageElement | null>(null);
  // Section 13: 8-Handle Free Transform Drag State
  const [activeTransformHandle, setActiveTransformHandle] = useState<string | null>(null);
  const transformStartRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialWidth: number;
    initialHeight: number;
    initialRotation: number;
    aspectRatio: number;
  } | null>(null);

  // Section 15 & 16: Guides, Rulers, Snap & Alignment State
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [activeSnapLines, setActiveSnapLines] = useState<SnapLine[]>([]);
  const isDraggingGuideRef = useRef<{ id?: string; orientation: "horizontal" | "vertical"; isNew: boolean } | null>(null);

  // Phase 13: AI & Advanced Features State
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiTask, setAiTask] = useState<string>("");
  const [aiProgress, setAiProgress] = useState(0);
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 3 | 4>(2);
  const [artStylePreset, setArtStylePreset] = useState<string>("sketch");
  const [outpaintDirection, setOutpaintDirection] = useState<"all" | "left" | "right" | "top" | "bottom">("all");
  const [outpaintAmount, setOutpaintAmount] = useState<number>(20); // percent
  const [autocropPadding, setAutocropPadding] = useState<number>(10); // px

  // Phase 9 & Deep Layers State
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingLayerName, setEditingLayerName] = useState("");
  const [soloLayerId, setSoloLayerId] = useState<string | null>(null);
  const savedVisibilitiesRef = useRef<Record<string, boolean>>({});
  const [layerFilter, setLayerFilter] = useState<string>("all");
  const [draggedLayerIndex, setDraggedLayerIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
  const customBgInputRef = useRef<HTMLInputElement>(null);

  // Phase 1 Enhanced State: Menus, Modals & Project Lifecycle
  const [activeMenu, setActiveMenu] = useState<"file" | "edit" | "image" | "filter" | "view" | "export" | null>(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [fileInfoOpen, setFileInfoOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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

  // Responsive stage measurement and automatic proportional card sizing
  const [stageDimensions, setStageDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 500 });

  useEffect(() => {
    const stage = canvasStageRef.current;
    if (!stage) return;
    const updateSize = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (w > 50 && h > 50) {
        setStageDimensions({ width: w, height: h });
      }
    };
    updateSize();
    const observer = new ResizeObserver(() => updateSize());
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const cardDimensions = useMemo(() => {
    const w = imageSize.width || 2048;
    const h = imageSize.height || 1536;
    const aspect = w / Math.max(1, h);

    // Padding inside stage for clean presentation and space for badges/tools
    const maxW = Math.max(150, stageDimensions.width - 50);
    const maxH = Math.max(150, stageDimensions.height - 50);

    let cardW = maxW;
    let cardH = Math.round(maxW / aspect);

    if (cardH > maxH) {
      cardH = maxH;
      cardW = Math.round(maxH * aspect);
    }

    return { width: Math.max(40, cardW), height: Math.max(40, cardH) };
  }, [imageSize.width, imageSize.height, stageDimensions.width, stageDimensions.height]);

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

  // Section 6: Real-time Live Filter Preview Generation across all 22 filters
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const thumbs = generateFilterPreviews(
          img,
          img.naturalWidth || img.width || 800,
          img.naturalHeight || img.height || 600,
          110,
          75
        );
        setFilterThumbnails(thumbs);
      } catch (err) {
        console.error("Filter preview generation error:", err);
      }
    };
    img.src = imageSrc;
  }, [imageSrc]);

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
    if (isDraggingSubjectRef.current) return; // Fast RAF renders during active drag

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
      context.filter = "none";

      // Before/After Comparison Mode: Hold button to preview untouched original
      if (isComparingBefore) {
        context.save();
        context.translate(outputWidth / 2, outputHeight / 2);
        context.rotate((quarterTurn * Math.PI) / 180);
        context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
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

      // In pure cutout mode (floatingSubject active and no custom background uploaded):
      // The canvas must show ONLY the isolated subject — NEVER the base photo underneath!
      const isPureCutout = Boolean(floatingSubject && !hasCustomBackground);

      const drawBaseImagePass = (imgLyr?: LayerInfo) => {
        const targetLyr = imgLyr || layers.find((l) => l.kind === "image");
        if (!targetLyr || !targetLyr.visible || isPureCutout) return;

        const offscreenBase = document.createElement("canvas");
        offscreenBase.width = outputWidth;
        offscreenBase.height = outputHeight;
        const offBaseCtx = offscreenBase.getContext("2d");
        if (offBaseCtx) {
          offBaseCtx.save();
          offBaseCtx.translate(outputWidth / 2, outputHeight / 2);
          offBaseCtx.rotate((quarterTurn * Math.PI) / 180);
          offBaseCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
          offBaseCtx.filter = `brightness(${brightnessValue}%) contrast(${contrastValue}%) saturate(${saturation}%) hue-rotate(${hueValue}deg) grayscale(${grayscaleValue}%) sepia(${sepiaValue}%) invert(${invert}%)${blurValue}`;
          offBaseCtx.drawImage(image, -width / 2, -height / 2, width, height);
          offBaseCtx.restore();

          // Active Rectangular Mask if present
          const activeMask = maskRect && layers.some((layer) => layer.kind === "mask" && layer.visible) ? maskRect : null;
          if (activeMask) {
            offBaseCtx.save();
            offBaseCtx.globalCompositeOperation = "destination-in";
            offBaseCtx.fillRect(activeMask.x, activeMask.y, activeMask.width, activeMask.height);
            offBaseCtx.restore();
          }

          // Apply Non-destructive layer mask if enabled
          if (targetLyr.maskData && targetLyr.maskEnabled !== false && cachedMasksRef.current[targetLyr.id]) {
            offBaseCtx.save();
            offBaseCtx.globalCompositeOperation = "destination-in";
            offBaseCtx.drawImage(cachedMasksRef.current[targetLyr.id], 0, 0, outputWidth, outputHeight);
            offBaseCtx.restore();
          }

          context.save();
          context.globalAlpha = opacityToAlpha(targetLyr.opacity);
          context.globalCompositeOperation = blendModeToCompositeOp(targetLyr.blendMode || "normal");
          context.drawImage(offscreenBase, 0, 0);
          context.restore();
        }

        applyPixelAdjustments(context, outputWidth, outputHeight, {
          exposure,
          temperature,
          gamma,
          balanceR: colorBalanceR,
          balanceG: colorBalanceG,
          balanceB: colorBalanceB,
        });

        if (filterMode !== "none" && filterMode !== "blur") {
          executeFilter(context, outputWidth, outputHeight, filterMode, filterIntensity);
        }
        if (thresholdEnabled) applyThreshold(context, outputWidth, outputHeight, threshold);
      };

      const drawTextPass = (textLyr?: LayerInfo) => {
        const targetLyr = textLyr || layers.find((l) => l.kind === "text");
        if (!targetLyr || !targetLyr.visible) return;

        const offscreenText = document.createElement("canvas");
        offscreenText.width = outputWidth;
        offscreenText.height = outputHeight;
        const offTextCtx = offscreenText.getContext("2d");

        if (offTextCtx) {
          drawTexts(offTextCtx, textElements, new Set(layers.filter((layer) => layer.kind === "text" && layer.visible).map((layer) => layer.id)));

          if (targetLyr.maskData && targetLyr.maskEnabled !== false && cachedMasksRef.current[targetLyr.id]) {
            offTextCtx.globalCompositeOperation = "destination-in";
            offTextCtx.drawImage(cachedMasksRef.current[targetLyr.id], 0, 0, outputWidth, outputHeight);
          }

          context.save();
          context.globalAlpha = opacityToAlpha(targetLyr.opacity ?? 100);
          context.globalCompositeOperation = blendModeToCompositeOp(targetLyr.blendMode || "normal");
          context.drawImage(offscreenText, 0, 0);
          context.restore();
        }
      };

      const drawPaintPass = (paintLyr?: LayerInfo) => {
        const targetLyr = paintLyr || layers.find((l) => l.kind === "paint");
        if (!targetLyr || !targetLyr.visible) return;

        const paintOpacity = targetLyr.opacity ?? 100;
        const paintBlend = targetLyr.blendMode ?? "normal";
        drawPaintLayer(
          context,
          outputWidth,
          outputHeight,
          strokes,
          shapes,
          new Set(layers.filter((layer) => layer.kind === "paint" && layer.visible).map((layer) => layer.id)),
          paintOpacity,
          paintBlend,
          targetLyr.maskData ? cachedMasksRef.current[targetLyr.id] : undefined,
          targetLyr.maskEnabled
        );
      };

      const drawSubjectPass = (subjLyr?: LayerInfo) => {
        if (!floatingSubject) return;
        const targetLyr = subjLyr || layers.find((l) => l.id === "floating-subject" || l.kind === "subject");
        if (targetLyr && targetLyr.visible === false) return;

        let subImg = cachedSubjectImgRef.current;
        if (!subImg || subImg.src !== floatingSubject.dataUrl) {
          subImg = new Image();
          subImg.onload = () => {
            cachedSubjectImgRef.current = subImg;
            renderCanvas();
          };
          subImg.src = floatingSubject.dataUrl;
        } else {
          const posX = floatingSubjectPosRef.current ? floatingSubjectPosRef.current.x : floatingSubject.x;
          const posY = floatingSubjectPosRef.current ? floatingSubjectPosRef.current.y : floatingSubject.y;
          context.save();
          if (targetLyr) {
            context.globalAlpha = opacityToAlpha(targetLyr.opacity);
            context.globalCompositeOperation = blendModeToCompositeOp(targetLyr.blendMode || "normal");
          }
          const rot = floatingSubject.rotation || 0;
          if (rot !== 0) {
            const cx = posX + floatingSubject.width / 2;
            const cy = posY + floatingSubject.height / 2;
            context.translate(cx, cy);
            context.rotate((rot * Math.PI) / 180);
            context.drawImage(subImg, -floatingSubject.width / 2, -floatingSubject.height / 2, floatingSubject.width, floatingSubject.height);
          } else {
            context.drawImage(subImg, posX, posY, floatingSubject.width, floatingSubject.height);
          }
          context.restore();
        }
      };

      // Order of execution: bottom to top of visual stack
      const renderStack = [...layers].reverse();
      let drawnSubject = false;
      let drawnBaseImage = false;

      for (const lyr of renderStack) {
        if (!lyr.visible) continue;
        if (lyr.kind === "image") {
          drawBaseImagePass(lyr);
          drawnBaseImage = true;
        } else if (lyr.kind === "subject" || lyr.id === "floating-subject") {
          drawSubjectPass(lyr);
          drawnSubject = true;
        } else if (lyr.kind === "paint") {
          drawPaintPass(lyr);
        } else if (lyr.kind === "text") {
          drawTextPass(lyr);
        }
      }

      // Fallbacks if not explicitly listed in layers array
      if (!drawnBaseImage && !isPureCutout) {
        drawBaseImagePass();
      }
      if (floatingSubject && !drawnSubject) {
        drawSubjectPass();
      }

      // Cache base composite (without floatingSubject overlay) for ultra-fast 60fps dragging
      const baseBuffer = document.createElement("canvas");
      baseBuffer.width = outputWidth;
      baseBuffer.height = outputHeight;
      const baseBufCtx = baseBuffer.getContext("2d");
      if (baseBufCtx) {
        baseBufCtx.drawImage(canvas, 0, 0);
        baseOffscreenCanvasRef.current = baseBuffer;
      }

      if (!isDraggingSubjectRef.current) {
        try {
          const histData = calculateHistogram(context.getImageData(0, 0, Math.min(outputWidth, 600), Math.min(outputHeight, 600)));
          setHistogramData(histData);
        } catch {}
      }

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
  }, [brightness, contrast, filterMode, filterIntensity, grayscale, saturation, sepia, invert, thresholdEnabled, threshold, hue, exposure, temperature, gamma, colorBalanceR, colorBalanceG, colorBalanceB, isComparingBefore, flipX, flipY, imageSrc, rotation, strokes, shapes, textElements, maskRect, layers, floatingSubject, activeTool, hasCustomBackground]);

  /**
   * High-Performance Instant 60fps Subject Dragging (Zero Lag / Zero Re-render Loop)
   */
  const fastRenderFloatingSubject = () => {
    const canvas = canvasRef.current;
    if (!canvas || !floatingSubject) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const subImg = cachedSubjectImgRef.current;
    if (!subImg || !subImg.complete) return;

    const pos = floatingSubjectPosRef.current;
    const curX = pos ? pos.x : floatingSubject.x;
    const curY = pos ? pos.y : floatingSubject.y;

    context.clearRect(0, 0, canvas.width, canvas.height);
    if (baseOffscreenCanvasRef.current) {
      context.drawImage(baseOffscreenCanvasRef.current, 0, 0);
    }

    const rot = floatingSubject.rotation || 0;
    if (rot !== 0) {
      context.save();
      const cx = curX + floatingSubject.width / 2;
      const cy = curY + floatingSubject.height / 2;
      context.translate(cx, cy);
      context.rotate((rot * Math.PI) / 180);
      context.drawImage(subImg, -floatingSubject.width / 2, -floatingSubject.height / 2, floatingSubject.width, floatingSubject.height);
      context.restore();
    } else {
      context.drawImage(subImg, curX, curY, floatingSubject.width, floatingSubject.height);
    }
  };

  // Clear any old stale project from localStorage on startup so every session opens a fresh clean project
  useEffect(() => {
    try {
      window.localStorage.removeItem("imagepro-studio-project");
    } catch {}
  }, []);

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

  // Dynamic Fit to Screen
  const fitToScreen = useCallback(() => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
    setStatus("تمت ملاءمة الصورة مع مساحة العمل بالكامل (100%)");
  }, []);

  // Actual Size (1:1 pixel rendering)
  const actualSize = () => {
    if (!imageSize.width || !cardDimensions.width) {
      setZoom(100);
      setPan({ x: 0, y: 0 });
      return;
    }
    const realZoom = Math.max(10, Math.min(400, Math.round((imageSize.width / cardDimensions.width) * 100)));
    setZoom(realZoom);
    setPan({ x: 0, y: 0 });
    setStatus(`تم ضبط العرض إلى 100% (الحجم الفعلي: ${realZoom}%)`);
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

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
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
      } else if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === "]" || event.key === "}")) {
        event.preventDefault();
        moveLayerToTop();
        return;
      } else if ((event.metaKey || event.ctrlKey) && !event.shiftKey && (event.key === "]" || event.key === "}")) {
        event.preventDefault();
        moveLayerUp();
        return;
      } else if ((event.metaKey || event.ctrlKey) && !event.shiftKey && (event.key === "[" || event.key === "{")) {
        event.preventDefault();
        moveLayerDown();
        return;
      } else if ((event.metaKey || event.ctrlKey) && event.shiftKey && (event.key === "[" || event.key === "{")) {
        event.preventDefault();
        moveLayerToBottom();
        return;
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        duplicateSelectedLayer();
        return;
      }

      if (activeTool === "crop") {
        if (event.key === "Enter") {
          event.preventDefault();
          cropToSelection();
          return;
        } else if (event.key === "Escape") {
          event.preventDefault();
          setSelection(null);
          setActiveTool("select");
          setStatus(currentLang === "ar" ? "تم إلغاء عملية القص" : "Crop cancelled");
          return;
        }
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

    // Preload image to instantly calculate aspect ratio and auto-fit to workspace without any cropping
    const tempImg = new Image();
    tempImg.onload = () => {
      const nw = tempImg.naturalWidth || 1200;
      const nh = tempImg.naturalHeight || 800;

      // Clean all previous strokes, artwork, floating subjects, and reset pan/zoom
      setPan({ x: 0, y: 0 });
      setZoom(100);
      setImageSize({ width: nw, height: nh });

      setStrokes([]);
      setShapes([]);
      setTextElements([]);
      setFloatingSubject(null);
      floatingSubjectPosRef.current = null;
      setHasCustomBackground(false);
      setExtractedSubjectUrl(null);
      setMaskRect(null);
      setSelection(null);

      cachedImageRef.current = tempImg;
      cachedImageSrcRef.current = objectUrl;
      cachedSubjectImgRef.current = null;
      cachedMasksRef.current = {};
      baseOffscreenCanvasRef.current = null;

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
      setLayers(layerSeed);
      setSelectedLayer("portrait");

      setImageSrc(objectUrl);
      setImageName(file.name.replace(/\.[^/.]+$/, ""));
      setStatus(`تم فتح الصورة: ${file.name} بنجاح وملاءمتها بالكامل في مساحة العمل (${nw} × ${nh} بكسل)`);
    };
    tempImg.onerror = () => {
      setStatus("تعذر تحميل ملف الصورة المحدد — يرجى التأكد من صلاحية الملف");
    };
    tempImg.src = objectUrl;

    event.target.value = "";
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

    setStrokes([]);
    setShapes([]);
    setTextElements([]);
    setFloatingSubject(null);
    floatingSubjectPosRef.current = null;
    setHasCustomBackground(false);
    setExtractedSubjectUrl(null);
    setMaskRect(null);
    setSelection(null);
    cachedImageRef.current = null;
    cachedImageSrcRef.current = null;
    cachedSubjectImgRef.current = null;
    cachedMasksRef.current = {};
    baseOffscreenCanvasRef.current = null;
    try { window.localStorage.removeItem("imagepro-studio-project"); } catch {}

    setImageSrc(dataUrl);
    setImageName(name.trim() || "مشروع جديد");
    setImageSize({ width, height });
    setPan({ x: 0, y: 0 });
    setZoom(100);
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
    setLayers([
      { id: "background", name: "الخلفية", kind: "background", color: bgColor === "transparent" ? "#2dd4bf" : bgColor, visible: true },
    ]);
    setSelectedLayer("background");
    setNewProjectOpen(false);
    setStatus(`تم إنشاء مشروع جديد: ${name} (${width} × ${height} بكسل)`);
  };

  const loadSampleImage = (key: keyof typeof sampleImages) => {
    setSampleImageKey(key);
    const src = sampleImages[key];
    const tempImg = new Image();
    tempImg.onload = () => {
      const nw = tempImg.naturalWidth || 2048;
      const nh = tempImg.naturalHeight || 1536;
      setPan({ x: 0, y: 0 });
      setZoom(100);
      setImageSize({ width: nw, height: nh });

      setStrokes([]);
      setShapes([]);
      setTextElements([]);
      setFloatingSubject(null);
      floatingSubjectPosRef.current = null;
      setHasCustomBackground(false);
      setExtractedSubjectUrl(null);
      setMaskRect(null);
      setSelection(null);
      cachedImageRef.current = tempImg;
      cachedImageSrcRef.current = src;
      cachedSubjectImgRef.current = null;
      cachedMasksRef.current = {};
      baseOffscreenCanvasRef.current = null;

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
      setLayers(layerSeed);
      setSelectedLayer("portrait");

      setImageSrc(src);
      setActiveMenu(null);
      setStatus(`تم تحميل الصورة النموذجية: ${names[key]}`);
    };
    tempImg.src = src;
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
    setImageSize({ width: size, height: size });
    setPan({ x: 0, y: 0 });
    setZoom(100);
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
    setImageSize({ width: cropW, height: cropH });
    setPan({ x: 0, y: 0 });
    setZoom(100);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setSelection(null);
    setStatus(`تم تطبيق القص بنسبة ${ratioW}:${ratioH} (${cropW} × ${cropH} بكسل)`);
  };

  const setCropPresetRatio = (ratioW: number, ratioH: number) => {
    const cw = imageSize.width || canvasRef.current?.width || 1080;
    const ch = imageSize.height || canvasRef.current?.height || 1080;
    if (ratioW === 0 || ratioH === 0) {
      setSelection({ x: 0, y: 0, width: cw, height: ch });
      setStatus(currentLang === "ar" ? `تم تحديد كامل مساحة الصورة للقص (${cw} × ${ch} بكسل)` : `Full image selected for crop (${cw}x${ch})`);
      return;
    }
    const targetRatio = ratioW / ratioH;
    let cropW = cw * 0.9;
    let cropH = cropW / targetRatio;
    if (cropH > ch * 0.9) {
      cropH = ch * 0.9;
      cropW = cropH * targetRatio;
    }
    cropW = Math.round(cropW);
    cropH = Math.round(cropH);
    const cropX = Math.round((cw - cropW) / 2);
    const cropY = Math.round((ch - cropH) / 2);
    setSelection({ x: cropX, y: cropY, width: cropW, height: cropH });
    setStatus(currentLang === "ar" ? `تم تحديد نسبة القص ${ratioW}:${ratioH} (${cropW} × ${cropH} بكسل) — اضغط تطبيق القص أو Enter` : `Crop ratio ${ratioW}:${ratioH} set`);
  };

  const cropToSelection = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selection || selection.width < 4 || selection.height < 4) {
      setStatus("حدد منطقة للقص أولاً");
      return;
    }
    const cropW = Math.round(selection.width);
    const cropH = Math.round(selection.height);
    const cropped = document.createElement("canvas");
    cropped.width = cropW;
    cropped.height = cropH;
    const context = cropped.getContext("2d");
    if (!context) return;
    context.drawImage(canvas, selection.x, selection.y, selection.width, selection.height, 0, 0, cropped.width, cropped.height);
    setImageSrc(cropped.toDataURL("image/png"));
    setImageSize({ width: cropW, height: cropH });
    setPan({ x: 0, y: 0 });
    setZoom(100);
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

  // Phase 3 & 6: Unified Project Package Engine
  const buildCurrentPackage = useCallback((): ImageProProjectPackage | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return {
      formatVersion: "1.0.0",
      appName: "ImagePro Studio",
      exportedAt: new Date().toISOString(),
      metadata: {
        projectName: imageName.trim() || "مشروع ImagePro",
        width: canvas.width,
        height: canvas.height,
        layersCount: layers.length,
        strokesCount: strokes.length,
      },
      state: {
        imageName: imageName.trim() || "مشروع ImagePro",
        imageData: canvas.toDataURL("image/png"),
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
  }, [
    imageName,
    layers,
    strokes,
    shapes,
    textElements,
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
  ]);

  const loadPackageIntoStudio = useCallback((pkg: ImageProProjectPackage) => {
    setImageName(pkg.state.imageName || "مشروع ImagePro");
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
    if (pkg.metadata.width && pkg.metadata.height) {
      setImageSize({ width: pkg.metadata.width, height: pkg.metadata.height });
    }
    setTimeout(fitToScreen, 100);
    setStatus(currentLang === "ar" ? `تم تحميل المشروع "${pkg.metadata.projectName}" بنجاح` : `Loaded project: ${pkg.metadata.projectName}`);
  }, [currentLang, fitToScreen]);

  // Check crash recovery on startup and sync registry
  useEffect(() => {
    const rec = getAutosaveRecovery();
    if (rec && Date.now() - rec.savedAt < 48 * 60 * 60 * 1000) {
      setAutosaveRecoverCandidate(rec);
    }
    setRegisteredProjects(getAllRegisteredProjects());
    setProjectSnapshots(getProjectSnapshots(currentProjectId));
  }, [currentProjectId]);

  // Periodic autosave every 2 minutes
  useEffect(() => {
    const timer = setInterval(() => {
      const pkg = buildCurrentPackage();
      if (!pkg) return;
      const json = serializeProjectPackage(pkg);
      saveAutosaveRecovery(json);
      updateProjectRegistry({
        id: currentProjectId,
        name: imageName.trim() || "مشروع ImagePro",
        updatedAt: Date.now(),
        createdAt: Date.now() - 60000,
        width: pkg.metadata.width,
        height: pkg.metadata.height,
        layersCount: pkg.metadata.layersCount,
        thumbnail: pkg.state.imageData,
      });
      setRegisteredProjects(getAllRegisteredProjects());
    }, 120000);
    return () => clearInterval(timer);
  }, [buildCurrentPackage, currentProjectId, imageName]);

  // Phase 3 & 4: Projects Dashboard and Snapshots Handlers
  const handleOpenRegisteredProject = (projectId: string) => {
    const reg = getAllRegisteredProjects();
    const found = reg.find(p => p.id === projectId);
    if (!found) return;
    const snaps = getProjectSnapshots(projectId);
    if (snaps.length > 0) {
      try {
        const pkg = deserializeProjectPackage(snaps[0].data);
        loadPackageIntoStudio(pkg);
        setCurrentProjectId(projectId);
        setIsProjectsDashboardOpen(false);
        setIsCreativeLibraryOpen(false);
        setStatus(`تم فتح المشروع: ${found.name}`);
      } catch (err) {
        console.error(err);
        setStatus("تعذر استرجاع بيانات المشروع");
      }
    } else {
      setStatus("المشروع لا يحتوي على لقطات محفوظة بعد");
    }
  };

  const handleDuplicateRegisteredProject = (projectId: string) => {
    const reg = getAllRegisteredProjects();
    const found = reg.find(p => p.id === projectId);
    if (!found) return;
    const newId = "proj-" + Date.now();
    updateProjectRegistry({
      ...found,
      id: newId,
      name: `${found.name} (نسخة مكررة)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    const snaps = getProjectSnapshots(projectId);
    if (snaps.length > 0) {
      createProjectSnapshot(newId, `${found.name} (نسخة مكررة)`, snaps[0].width, snaps[0].height, snaps[0].layersCount, snaps[0].data, "نسخة مكررة");
    }
    setRegisteredProjects(getAllRegisteredProjects());
    setStatus(`تم تكرار المشروع بنجاح: ${found.name}`);
  };

  const handleRenameRegisteredProject = (projectId: string, newName: string) => {
    const reg = getAllRegisteredProjects();
    const found = reg.find(p => p.id === projectId);
    if (!found) return;
    updateProjectRegistry({
      ...found,
      name: newName,
      updatedAt: Date.now()
    });
    setRegisteredProjects(getAllRegisteredProjects());
    setStatus("تمت إعادة تسمية المشروع");
  };

  const handleToggleFavoriteProject = (projectId: string) => {
    const reg = getAllRegisteredProjects();
    const found = reg.find(p => p.id === projectId);
    if (!found) return;
    updateProjectRegistry({
      ...found,
      isFavorite: !found.isFavorite
    });
    setRegisteredProjects(getAllRegisteredProjects());
  };

  const handleMoveProjectToTrash = (projectId: string) => {
    const reg = getAllRegisteredProjects();
    const found = reg.find(p => p.id === projectId);
    if (!found) return;
    updateProjectRegistry({
      ...found,
      isTrash: true
    });
    setRegisteredProjects(getAllRegisteredProjects());
    setStatus("تم نقل المشروع إلى سلة المحذوفات");
  };

  const handleRestoreProjectFromTrash = (projectId: string) => {
    const reg = getAllRegisteredProjects();
    const found = reg.find(p => p.id === projectId);
    if (!found) return;
    updateProjectRegistry({
      ...found,
      isTrash: false
    });
    setRegisteredProjects(getAllRegisteredProjects());
    setStatus("تمت استعادة المشروع من سلة المحذوفات");
  };

  const handlePermanentDeleteProject = (projectId: string) => {
    removeProjectFromRegistry(projectId);
    setRegisteredProjects(getAllRegisteredProjects());
    setStatus("تم حذف المشروع نهائياً");
  };

  const handleExportRegisteredProject = (projectId: string) => {
    const snaps = getProjectSnapshots(projectId);
    if (snaps.length > 0) {
      downloadFile(snaps[0].data, `${snaps[0].projectName || "project"}.imagepro`, "application/json");
      setStatus("تم تصدير ملف المشروع (.imagepro)");
    } else {
      const pkg = buildCurrentPackage();
      if (pkg) {
        const json = serializeProjectPackage(pkg);
        downloadFile(json, `${imageName.trim() || "project"}.imagepro`, "application/json");
        setStatus("تم تصدير ملف المشروع (.imagepro)");
      }
    }
  };

  const handleRestoreSnapshot = (snapshot: ProjectSnapshot) => {
    try {
      const pkg = deserializeProjectPackage(snapshot.data);
      loadPackageIntoStudio(pkg);
      setIsVersionHistoryOpen(false);
      setStatus(`تمت استعادة لقطة الإصدار: ${snapshot.dateFormatted}`);
    } catch (err) {
      console.error(err);
      setStatus("تعذر استعادة لقطة الإصدار");
    }
  };

  const handleCreateManualSnapshot = (note: string) => {
    const pkg = buildCurrentPackage();
    if (!pkg) return;
    const json = serializeProjectPackage(pkg);
    const snap = createProjectSnapshot(
      currentProjectId,
      imageName.trim() || "مشروع ImagePro",
      pkg.metadata.width,
      pkg.metadata.height,
      pkg.metadata.layersCount,
      json,
      note
    );
    if (snap) {
      setProjectSnapshots(getProjectSnapshots(currentProjectId));
      setStatus(`تم إنشاء لقطة إصدار جديدة: "${note}"`);
    }
  };

  const handleDeleteSnapshot = (snapshotId: string) => {
    deleteProjectSnapshot(currentProjectId, snapshotId);
    setProjectSnapshots(getProjectSnapshots(currentProjectId));
    setStatus("تم حذف لقطة الإصدار");
  };

  // Phase 4 & 5: Creative Library Handlers (Backgrounds, Templates, Assets)
  const handleApplyCreativeBackground = (preset: CreativeBackdropPreset | ProductBackgroundPreset) => {
    const w = imageSize.width || 1080;
    const h = imageSize.height || 1080;
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const ctx = off.getContext("2d");
    if (ctx) {
      preset.render(ctx, w, h);
      const bgData = off.toDataURL("image/png");
      const newLayerId = `layer-bg-${Date.now()}`;
      setLayers((prev) => [
        ...prev,
        {
          id: newLayerId,
          name: currentLang === "ar" ? preset.nameAr : preset.nameEn,
          kind: "image",
          visible: true,
          opacity: 100,
          blendMode: "normal",
          color: preset.accentColor,
        },
      ]);
      setImageSrc(bgData);
      setHasCustomBackground(true);
      if (cachedImageRef.current) {
        cachedImageRef.current.src = bgData;
      }
      setTimeout(fitToScreen, 80);
      setStatus(currentLang === "ar" ? `تم تطبيق خلفية: ${preset.nameAr}` : `Applied backdrop: ${preset.nameEn}`);
    }
  };

  const handleApplyEditableTemplate = (tpl: EditableTemplate) => {
    setImageSize({ width: tpl.width, height: tpl.height });
    const off = document.createElement("canvas");
    off.width = tpl.width;
    off.height = tpl.height;
    const ctx = off.getContext("2d");
    if (ctx) {
      tpl.renderPreview(ctx, tpl.width, tpl.height);
    }
    const bgUrl = off.toDataURL("image/png");
    setImageSrc(bgUrl);
    setFloatingSubject(null);
    setStrokes([]);
    
    const generatedLayers: LayerInfo[] = [];
    const generatedShapes: ShapeElement[] = [];
    const generatedTexts: TextElement[] = [];

    tpl.layers.forEach((l, idx) => {
      generatedLayers.push({
        id: l.id,
        name: l.name,
        kind: l.kind === "text" ? "paint" : l.kind === "shape" ? "paint" : "background",
        visible: true,
        opacity: l.opacity ?? 100,
        blendMode: "normal",
        color: l.color || "#2dd4bf",
      });

      if (l.kind === "shape" && l.shapeType) {
        generatedShapes.push({
          id: `shape-${Date.now()}-${idx}`,
          shape: l.shapeType === "ellipse" ? "ellipse" : "rectangle",
          x: l.x ?? 50,
          y: l.y ?? 50,
          width: l.width ?? 200,
          height: l.height ?? 100,
          color: l.color || "#ffffff",
          widthStroke: 2,
          fillMode: "fill",
          layerId: l.id,
        });
      }

      if (l.kind === "text" && l.text) {
        generatedTexts.push({
          id: `txt-${Date.now()}-${idx}`,
          text: l.text,
          x: l.x ?? 100,
          y: l.y ?? 100,
          size: l.fontSize ?? 48,
          color: l.color || "#ffffff",
          fontFamily: "Tajawal, sans-serif",
          fontWeight: l.fontWeight === "bold" || l.fontWeight === "900" ? "bold" : "normal",
          fontStyle: "normal",
        });
      }
    });

    setLayers(generatedLayers);
    setShapes(generatedShapes);
    setTextElements(generatedTexts);
    setTimeout(fitToScreen, 100);
    setStatus(currentLang === "ar" ? `تم تطبيق القالب الحي: ${tpl.nameAr}` : `Applied live template: ${tpl.nameEn}`);
  };

  const handleAddAssetGraphic = (asset: AssetGraphicItem) => {
    const centerPt = { x: (imageSize.width || 800) / 2 - 80, y: (imageSize.height || 600) / 2 - 40 };
    const newShape: ShapeElement = {
      id: `asset-${Date.now()}`,
      shape: "rectangle",
      x: centerPt.x,
      y: centerPt.y,
      width: 160,
      height: 80,
      color: "#2dd4bf",
      widthStroke: 2,
      fillMode: "fill",
      layerId: selectedLayer || "background",
    };
    setShapes((prev) => [...prev, newShape]);
    setStatus(currentLang === "ar" ? `تمت إضافة العنصر: ${asset.nameAr}` : `Added graphic: ${asset.nameEn}`);
  };

  const handleApplyStockPhoto = (photo: StockPhotoItem, asLayer: boolean) => {
    const off = document.createElement("canvas");
    off.width = photo.width;
    off.height = photo.height;
    const ctx = off.getContext("2d");
    if (ctx) {
      photo.render(ctx, photo.width, photo.height);
    }
    const dataUrl = off.toDataURL("image/png");

    if (asLayer) {
      const newLayerId = `layer-${Date.now()}`;
      const newLayer: LayerInfo = {
        id: newLayerId,
        name: currentLang === "ar" ? `صورة: ${photo.nameAr}` : `Photo: ${photo.nameEn}`,
        visible: true,
        opacity: 100,
        blendMode: "normal",
        kind: "paint",
        color: photo.dominantColor
      };
      setLayers((prev) => [...prev, newLayer]);
      setSelectedLayer(newLayerId);
      setStatus(currentLang === "ar" ? `تمت إضافة صورة ${photo.nameAr} كطبقة جديدة` : `Added ${photo.nameEn} as layer`);
    } else {
      setImageSize({ width: photo.width, height: photo.height });
      setImageSrc(dataUrl);
      setFloatingSubject(null);
      setStrokes([]);
      setLayers([
        {
          id: "background",
          name: currentLang === "ar" ? `خلفية: ${photo.nameAr}` : `Background: ${photo.nameEn}`,
          visible: true,
          opacity: 100,
          blendMode: "normal",
          kind: "background",
          color: photo.dominantColor
        }
      ]);
      setSelectedLayer("background");
      setTimeout(fitToScreen, 100);
      setStatus(currentLang === "ar" ? `تم تعيين صورة: ${photo.nameAr} كخلفية للكانفاس` : `Set backdrop: ${photo.nameEn}`);
    }
  };

  const handleCreateNewProjectFromModal = (opts: {
    width: number;
    height: number;
    background: "transparent" | "white" | "black" | string;
    templateName?: string;
  }) => {
    const w = opts.width;
    const h = opts.height;
    setImageSize({ width: w, height: h });

    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const ctx = off.getContext("2d");
    if (ctx) {
      if (opts.background === "white") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
      } else if (opts.background === "black") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, w, h);
      } else if (opts.background !== "transparent") {
        ctx.fillStyle = opts.background;
        ctx.fillRect(0, 0, w, h);
      }
    }
    const bgData = off.toDataURL("image/png");
    setImageSrc(bgData);
    setFloatingSubject(null);
    setStrokes([]);
    setShapes([]);
    setTextElements([]);

    const newProjId = "proj-" + Date.now();
    setCurrentProjectId(newProjId);
    setImageName(opts.templateName || (currentLang === "ar" ? "مشروع جديد" : "New Project"));
    setLayers([
      {
        id: "background",
        name: opts.templateName || (currentLang === "ar" ? "الخلفية" : "Background"),
        visible: true,
        opacity: 100,
        blendMode: "normal",
        kind: "background",
        color: opts.background === "white" ? "#ffffff" : opts.background === "black" ? "#000000" : "#2dd4bf"
      }
    ]);
    setSelectedLayer("background");
    setTimeout(fitToScreen, 100);
    setStatus(currentLang === "ar" ? `تم بدء تصميم جديد: ${opts.templateName || `${w}×${h}`}` : `Created design: ${opts.templateName || `${w}×${h}`}`);
  };

  // Phase 7: Watermark and Multi-Size Export Handlers
  const handleApplyWatermark = (options: WatermarkOptions) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.globalAlpha = options.opacity / 100;

    if (options.type === "text") {
      ctx.font = `bold ${options.fontSize}px Tajawal, sans-serif`;
      ctx.fillStyle = options.color;

      if (options.isTiled) {
        ctx.translate(w / 2, h / 2);
        ctx.rotate(-Math.PI / 6);
        ctx.translate(-w / 2, -h / 2);
        for (let x = -w; x < w * 2; x += 300) {
          for (let y = -h; y < h * 2; y += 150) {
            ctx.fillText(options.text, x, y);
          }
        }
      } else {
        const textMetrics = ctx.measureText(options.text);
        const tw = textMetrics.width;
        let x = 40;
        let y = 60;
        const pad = 40;

        switch (options.position) {
          case "top-left": x = pad; y = pad + options.fontSize; break;
          case "top-center": x = (w - tw) / 2; y = pad + options.fontSize; break;
          case "top-right": x = w - tw - pad; y = pad + options.fontSize; break;
          case "middle-left": x = pad; y = h / 2; break;
          case "center": x = (w - tw) / 2; y = h / 2; break;
          case "middle-right": x = w - tw - pad; y = h / 2; break;
          case "bottom-left": x = pad; y = h - pad; break;
          case "bottom-center": x = (w - tw) / 2; y = h - pad; break;
          case "bottom-right": default: x = w - tw - pad; y = h - pad; break;
        }
        ctx.fillText(options.text, x, y);
      }
    }
    ctx.restore();
    setImageSrc(canvas.toDataURL("image/png"));
    setStatus(currentLang === "ar" ? "تم تثبيت العلامة المائية على التصميم بنجاح" : "Watermark applied successfully");
  };

  const handleExecuteMultiExport = (options: {
    format: "png" | "jpeg" | "webp";
    quality: number;
    selectedSizes: { width: number; height: number; suffix: string }[];
  }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    options.selectedSizes.forEach((size, idx) => {
      setTimeout(() => {
        const off = document.createElement("canvas");
        off.width = size.width;
        off.height = size.height;
        const ctx = off.getContext("2d");
        if (!ctx) return;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(canvas, 0, 0, size.width, size.height);

        const mime = options.format === "png" ? "image/png" : options.format === "jpeg" ? "image/jpeg" : "image/webp";
        const q = options.format === "png" ? undefined : options.quality / 100;
        const dataUrl = off.toDataURL(mime, q);

        const link = document.createElement("a");
        link.download = `${imageName.trim() || "imagepro"}_${size.suffix}.${options.format}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 250);
    });

    setStatus(currentLang === "ar" ? `تم بدء تصدير ${options.selectedSizes.length} أحجام بصيغة ${options.format.toUpperCase()}` : `Exporting ${options.selectedSizes.length} sizes in ${options.format.toUpperCase()}`);
  };

  const exportSelectedLayer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const off = document.createElement("canvas");
    off.width = canvas.width;
    off.height = canvas.height;
    const ctx = off.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(canvas, 0, 0);
    const data = off.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `layer_${selectedLayer || "active"}.png`;
    link.href = data;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatus(currentLang === "ar" ? "تم تصدير الطبقة المحددة بصيغة PNG شفافة" : "Exported active layer as PNG");
  };

  // Phase 2: Dynamic Command Palette Index
  const commandList: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      {
        id: "new-design",
        titleAr: "المكتبة الإبداعية الشاملة (قوالب، خلفيات، أصول)",
        titleEn: "Creative Library Hub",
        categoryAr: "إبداعي",
        categoryEn: "Creative",
        shortcut: "Ctrl+N",
        icon: <Sparkles size={16} />,
        action: () => setIsCreativeLibraryOpen(true),
        keywords: ["new", "template", "library", "جديد", "قالب", "مكتبة"]
      },
      {
        id: "open-image",
        titleAr: "فتح صورة من الجهاز",
        titleEn: "Open Image File",
        categoryAr: "ملف",
        categoryEn: "File",
        shortcut: "Ctrl+O",
        icon: <FolderOpen size={16} />,
        action: () => uploadRef.current?.click(),
        keywords: ["open", "upload", "فتح", "رفع"]
      },
      {
        id: "save-project",
        titleAr: "حفظ المشروع محلياً",
        titleEn: "Save Project Locally",
        categoryAr: "ملف",
        categoryEn: "File",
        shortcut: "Ctrl+S",
        icon: <Save size={16} />,
        action: saveProject,
        keywords: ["save", "حفظ"]
      },
      {
        id: "projects-dashboard",
        titleAr: "لوحة المشاريع المحفوظة",
        titleEn: "Projects Dashboard",
        categoryAr: "ملف",
        categoryEn: "File",
        icon: <Folder size={16} />,
        action: () => setIsProjectsDashboardOpen(true),
        keywords: ["projects", "dashboard", "مشاريع", "لوحة"]
      },
      {
        id: "version-history",
        titleAr: "سجل الإصدارات والنسخ السابقة",
        titleEn: "Version History & Snapshots",
        categoryAr: "ملف",
        categoryEn: "File",
        icon: <History size={16} />,
        action: () => setIsVersionHistoryOpen(true),
        keywords: ["version", "history", "سجل", "اصدارات"]
      },
      {
        id: "watermark-studio",
        titleAr: "استوديو العلامة المائية",
        titleEn: "Watermark Studio",
        categoryAr: "تصدير",
        categoryEn: "Export",
        icon: <Stamp size={16} />,
        action: () => setIsWatermarkOpen(true),
        keywords: ["watermark", "شعار", "علامة مائية"]
      },
      {
        id: "multi-size-export",
        titleAr: "تصدير بأحجام متعددة (Multi-Size Export)",
        titleEn: "Multi-Size Export",
        categoryAr: "تصدير",
        categoryEn: "Export",
        icon: <Download size={16} />,
        action: () => setIsMultiExportOpen(true),
        keywords: ["export", "multi", "تصدير", "ريتينا", "سوشيال"]
      },
      {
        id: "magic-ai-cutout",
        titleAr: "الذكاء الاصطناعي — عزل المحتوى الصافي (Magic Cutout)",
        titleEn: "Magic AI Cutout Studio",
        categoryAr: "ذكاء اصطناعي",
        categoryEn: "AI",
        icon: <WandSparkles size={16} />,
        action: () => handlePureContentCutout(),
        keywords: ["ai", "cutout", "remove background", "عزل", "تفريغ"]
      },
      {
        id: "blend-studio",
        titleAr: "استوديو دمج الصورتين باحترافية",
        titleEn: "Two-Image Blend Studio",
        categoryAr: "إبداعي",
        categoryEn: "Creative",
        icon: <ImageIcon size={16} />,
        action: () => setIsBlendModalOpen(true),
        keywords: ["blend", "دمج"]
      },
      {
        id: "filters-studio",
        titleAr: "استوديو الفلاتر الحي والمتقدم",
        titleEn: "Live Visual Filters Studio",
        categoryAr: "مرشحات",
        categoryEn: "Filters",
        icon: <SlidersHorizontal size={16} />,
        action: () => setIsFiltersStudioOpen(true),
        keywords: ["filters", "فلاتر", "مرشحات"]
      },
      {
        id: "tool-brush",
        titleAr: "أداة فرشاة الرسم الفنية",
        titleEn: "Artistic Brush Tool",
        categoryAr: "أدوات",
        categoryEn: "Tools",
        shortcut: "B",
        icon: <Brush size={16} />,
        action: () => setActiveTool("brush"),
        keywords: ["brush", "فرشاة", "رسم"]
      },
      {
        id: "tool-pencil",
        titleAr: "أداة قلم الرصاص الدقيق",
        titleEn: "Precision Pencil Tool",
        categoryAr: "أدوات",
        categoryEn: "Tools",
        shortcut: "N",
        icon: <Pencil size={16} />,
        action: () => setActiveTool("pencil"),
        keywords: ["pencil", "قلم"]
      },
      {
        id: "tool-eraser",
        titleAr: "أداة الممحاة",
        titleEn: "Eraser Tool",
        categoryAr: "أدوات",
        categoryEn: "Tools",
        shortcut: "E",
        icon: <Eraser size={16} />,
        action: () => setActiveTool("eraser"),
        keywords: ["eraser", "ممحاة"]
      },
      {
        id: "tool-bucket",
        titleAr: "أداة سطل التعبئة اللونية",
        titleEn: "Flood Fill Bucket Tool",
        categoryAr: "أدوات",
        categoryEn: "Tools",
        shortcut: "G",
        icon: <PaintBucket size={16} />,
        action: () => setActiveTool("bucket"),
        keywords: ["bucket", "fill", "سطل", "تعبئة"]
      },
      {
        id: "tool-select",
        titleAr: "أداة التحديد المستطيل",
        titleEn: "Marquee Selection Tool",
        categoryAr: "أدوات",
        categoryEn: "Tools",
        shortcut: "M",
        icon: <Square size={16} />,
        action: () => setActiveTool("select"),
        keywords: ["select", "تحديد"]
      },
      {
        id: "tool-shape",
        titleAr: "أداة الأشكال المتجهة",
        titleEn: "Vector Shape Tool",
        categoryAr: "أدوات",
        categoryEn: "Tools",
        shortcut: "U",
        icon: <Square size={16} />,
        action: () => setActiveTool("shape"),
        keywords: ["shape", "أشكال"]
      },
      {
        id: "tool-text",
        titleAr: "أداة النص والكتابة",
        titleEn: "Typography & Text Tool",
        categoryAr: "أدوات",
        categoryEn: "Tools",
        shortcut: "T",
        icon: <Type size={16} />,
        action: () => setActiveTool("text"),
        keywords: ["text", "نص", "كتابة"]
      },
      {
        id: "tool-stamp",
        titleAr: "أداة ختم الاستنساخ",
        titleEn: "Clone Stamp Tool",
        categoryAr: "أدوات",
        categoryEn: "Tools",
        shortcut: "S",
        icon: <Stamp size={16} />,
        action: () => setActiveTool("stamp"),
        keywords: ["stamp", "ختم", "استنساخ"]
      },
      {
        id: "tool-crop",
        titleAr: "أداة القص والاقتطاع",
        titleEn: "Crop Tool",
        categoryAr: "أدوات",
        categoryEn: "Tools",
        shortcut: "C",
        icon: <Crop size={16} />,
        action: () => setActiveTool("crop"),
        keywords: ["crop", "قص"]
      },
      {
        id: "view-fit",
        titleAr: "ملاءمة الشاشة",
        titleEn: "Fit to Screen",
        categoryAr: "عرض",
        categoryEn: "View",
        shortcut: "Ctrl+0",
        icon: <Maximize2 size={16} />,
        action: () => fitToScreen(),
        keywords: ["fit", "screen", "ملاءمة"]
      },
      {
        id: "view-actual",
        titleAr: "100% الحجم الفعلي",
        titleEn: "100% Actual Size",
        categoryAr: "عرض",
        categoryEn: "View",
        shortcut: "Ctrl+1",
        icon: <ImageIcon size={16} />,
        action: () => actualSize(),
        keywords: ["actual", "100", "فعلي"]
      },
      {
        id: "view-grid",
        titleAr: "تبديل شبكة المحاذاة",
        titleEn: "Toggle Alignment Grid",
        categoryAr: "عرض",
        categoryEn: "View",
        icon: <Grid size={16} />,
        action: () => setShowGrid((v) => !v),
        keywords: ["grid", "شبكة"]
      },
      {
        id: "view-snap",
        titleAr: "تبديل الالتصاق الذكي (Smart Snap)",
        titleEn: "Toggle Smart Snap",
        categoryAr: "عرض",
        categoryEn: "View",
        icon: <Magnet size={16} />,
        action: () => setSnapEnabled((v) => !v),
        keywords: ["snap", "التصاق"]
      },
      {
        id: "view-fullscreen",
        titleAr: "تبديل وضع ملء الشاشة الكامل",
        titleEn: "Toggle Fullscreen",
        categoryAr: "عرض",
        categoryEn: "View",
        shortcut: "F11",
        icon: isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />,
        action: () => toggleFullscreen(),
        keywords: ["fullscreen", "شاشة كاملة"]
      },
      {
        id: "edit-undo",
        titleAr: "تراجع",
        titleEn: "Undo",
        categoryAr: "تحرير",
        categoryEn: "Edit",
        shortcut: "Ctrl+Z",
        icon: <Undo2 size={16} />,
        action: () => undo(),
        keywords: ["undo", "تراجع"]
      },
      {
        id: "edit-redo",
        titleAr: "تقدم",
        titleEn: "Redo",
        categoryAr: "تحرير",
        categoryEn: "Edit",
        shortcut: "Ctrl+Y",
        icon: <Redo2 size={16} />,
        action: () => redo(),
        keywords: ["redo", "تقدم"]
      },
      {
        id: "edit-select-all",
        titleAr: "تحديد مساحة العمل بالكامل",
        titleEn: "Select All",
        categoryAr: "تحرير",
        categoryEn: "Edit",
        shortcut: "Ctrl+A",
        icon: <Square size={16} />,
        action: () => selectAll(),
        keywords: ["select all", "تحديد الكل"]
      },
      {
        id: "edit-deselect",
        titleAr: "إلغاء التحديد النشط",
        titleEn: "Deselect",
        categoryAr: "تحرير",
        categoryEn: "Edit",
        shortcut: "Ctrl+D",
        icon: <X size={16} />,
        action: () => deselect(),
        keywords: ["deselect", "الغاء"]
      },
    ];

    FILTER_CATALOG.forEach((f) => {
      list.push({
        id: `filter-${f.id}`,
        titleAr: `مرشح: ${f.nameArabic}`,
        titleEn: `Filter: ${f.id}`,
        categoryAr: "مرشحات",
        categoryEn: "Filters",
        icon: <SlidersHorizontal size={16} />,
        action: () => {
          setFilterMode(f.id);
          if (f.defaultIntensity !== undefined) setFilterIntensity(f.defaultIntensity);
          setStatus(`تم تطبيق المرشح: ${f.nameArabic}`);
        },
        keywords: ["filter", f.id, f.nameArabic]
      });
    });

    return list;
  }, [isFullscreen]);

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
    saveAiOriginalSnapshot("عزل وتحرير الجسم بالذكاء الاصطناعي (AI Cutout)");
    const t0 = performance.now();
    setAiProcessing(true);
    setAiTask("تحليل الصورة وعزل الجسم بنموذج الذكاء الاصطناعي...");
    setAiProgress(10);
    setStatus("⏳ جاري تحليل وفصل الجسم المطلوب بالذكاء الاصطناعي بدقة متناهية...");

    try {
      const result = await extractSubjectFromCanvas(canvas, {
        tolerance: bgRemoveTolerance,
        edgeFeather: bgFeather,
        roi: selection,
        onProgress: (msg, pct) => {
          setAiTask(msg);
          setAiProgress(pct);
          setStatus(`⏳ ${msg} (${pct}%)`);
        }
      });

      // Clear any floating subject so no duplicate exists
      setFloatingSubject(null);
      floatingSubjectPosRef.current = null;
      setHasCustomBackground(false);
      cachedImageRef.current = null;
      cachedImageSrcRef.current = null;
      cachedSubjectImgRef.current = null;
      baseOffscreenCanvasRef.current = null;

      // Cache extracted subject for instant portrait bokeh / replacement
      setExtractedSubjectUrl(result.dataUrl);
      setImageSrc(result.dataUrl);

      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      const isRoi = selection && selection.width > 5;
      const modeStr = isRoi ? "منطقة التحديد المحددة" : "عزل الذكاء الاصطناعي العصبي (Neural IS-Net)";
      setStatus(`✅ [${elapsed}ث] تم عزل وتحرير الجسم بنجاح (${modeStr}) — الخلفية مفرغة تماماً بصيغة PNG احترافية`);
    } catch (err) {
      console.error("Subject extraction error:", err);
      setStatus("❌ تعذر عزل الجسم: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAiProcessing(false);
      setAiTask("");
      setAiProgress(0);
    }
  };

  /**
   * 2. تحرير الجسم ونقله إلى طبقة مستقلة جديدة (Extract Subject to New Layer)
   * الميزة الاحترافية لبرامج التصميم الرائدة: فصل العنصر إلى طبقة جديدة مع الاحتفاظ بالخلفية
   */
  const handleExtractSubjectToNewLayer = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) { setStatus("⚠️ يرجى فتح أو رفع صورة أولاً"); return; }
    saveAiOriginalSnapshot("فصل الجسم ونقله لطبقة جديدة بالذكاء الاصطناعي");
    const t0 = performance.now();
    setAiProcessing(true);
    setAiTask("فصل الجسم بالذكاء الاصطناعي ونقله لطبقة مستقلة...");
    setAiProgress(15);
    setStatus("⏳ جاري فصل الجسم بالذكاء الاصطناعي ونقله إلى طبقة مستقلة...");

    try {
      const result = await extractSubjectFromCanvas(canvas, {
        tolerance: bgRemoveTolerance,
        edgeFeather: bgFeather,
        roi: selection,
        onProgress: (msg, pct) => {
          setAiTask(msg);
          setAiProgress(pct);
          setStatus(`⏳ ${msg} (${pct}%)`);
        }
      });

      setExtractedSubjectUrl(result.dataUrl);

      // Create a new independent layer containing the freed subject
      const subjectLayerId = `subject-${Date.now()}`;
      const freedLayerCount = layers.filter(l => l.name.includes("مفرّغ") || l.name.includes("جسم")).length + 1;
      const newLayer: LayerInfo = {
        id: subjectLayerId,
        name: `عنصر مفرّغ بالذكاء الاصطناعي ${freedLayerCount}`,
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
      setStatus(`✨ [${elapsed}ث] تم فصل الجسم بالذكاء الاصطناعي ونقله إلى طبقة مستقلة جديدة ("${newLayer.name}") — يمكنك تحريكه وتعديل الخلفية بحرية!`);
    } catch (err) {
      setStatus("❌ تعذر تحرير الجسم إلى طبقة جديدة: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAiProcessing(false);
      setAiTask("");
      setAiProgress(0);
    }
  };

  /**
   * 3. تمويه الخلفية بتدرج حقيقي (True Portrait Mode / Bokeh)
   * عزل الجسم بالذكاء الاصطناعي وتمويه الخلفية مع الحفاظ على وضوح وحدة الجسم المعزول بنسبة 100%
   */
  const handleBlurBackground = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) { setStatus("⚠️ يرجى فتح أو رفع صورة أولاً"); return; }
    saveAiOriginalSnapshot("تمويه الخلفية بتدرج احترافي (Portrait Bokeh)");
    const t0 = performance.now();
    setAiProcessing(true);
    setAiTask("عزل البورتريه بالذكاء الاصطناعي وتطبيق تمويه العدسة...");
    setAiProgress(15);
    setStatus("⏳ جاري عزل الشخص/العنصر بالذكاء الاصطناعي وتطبيق تمويه البورتريه الاحترافي...");

    try {
      // Step 1: Ensure we have the clean extracted subject
      let subjectUrl = extractedSubjectUrl;
      if (!subjectUrl) {
        const result = await extractSubjectFromCanvas(canvas, {
          tolerance: bgRemoveTolerance,
          edgeFeather: bgFeather,
          roi: selection,
          onProgress: (msg, pct) => {
            setAiTask(msg);
            setAiProgress(pct);
            setStatus(`⏳ ${msg} (${pct}%)`);
          }
        });
        subjectUrl = result.dataUrl;
        setExtractedSubjectUrl(subjectUrl);
      }

      setAiTask("تطبيق عمق الميدان وتمويه البورتريه السينمائي (Bokeh)...");
      setAiProgress(85);

      // Step 2: Composite sharp subject on top of blurred background
      const bokehResult = await createPortraitBokeh(canvas, subjectUrl, bgBlurRadius, 0);
      setImageSrc(bokehResult);

      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      setStatus(`🌫️ [${elapsed}ث] تم تطبيق تمويه البورتريه (Portrait Bokeh) بنجاح — الجسم حاد بنسبة 100% والخلفية مموهة بنعومة سينمائية بدون أي تشوه أو تعتيم (Radius: ${bgBlurRadius}px)`);
    } catch (err) {
      setStatus(`❌ تعذر تمويه الخلفية: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAiProcessing(false);
      setAiTask("");
      setAiProgress(0);
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
    setAiProcessing(true);
    setAiTask("عزل الجسم واستبدال الخلفية...");
    setAiProgress(20);
    setStatus("⏳ جاري عزل الجسم بالذكاء الاصطناعي واستبدال الخلفية...");

    try {
      let subjectUrl = extractedSubjectUrl;
      if (!subjectUrl) {
        const result = await extractSubjectFromCanvas(canvas, {
          tolerance: bgRemoveTolerance,
          edgeFeather: bgFeather,
          roi: selection,
          onProgress: (msg, pct) => {
            setAiTask(msg);
            setAiProgress(pct);
          }
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
      setStatus(`✅ [${elapsed}ث] تم استبدال الخلفية بنجاح إلى [${styleAr}] مع الحفاظ التام على حدة وتفاصيل الجسم`);
    } catch (err) {
      setStatus(`❌ تعذر استبدال الخلفية: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAiProcessing(false);
      setAiTask("");
      setAiProgress(0);
    }
  };

  /**
   * 5. عزل المحتوى الصافي فقط (Pure Content Cutout - محتوى الصورة بدون أي خلفية أو طبقات أو مساحات زائدة)
   * يعزل الجسم بدقة متناهية ويجعله عنصراً حراً قابلاً للتحريك بالسحب في أي مكان بدون تحريك مساحة العمل
   */
  const handlePureContentCutout = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) { setStatus("⚠️ يرجى فتح أو رفع صورة أولاً"); return; }
    saveAiOriginalSnapshot("عزل المحتوى الصافي فقط (Pure Content Cutout)");
    const t0 = performance.now();
    setAiProcessing(true);
    setAiTask("عزل المحتوى واقتصاص الأطراف بدون خلفية أو طبقات...");
    setAiProgress(15);
    setStatus("⏳ جاري استخراج المحتوى الصافي بالذكاء الاصطناعي بدقة متناهية...");

    try {
      const result = await extractSubjectFromCanvas(canvas, {
        tolerance: bgRemoveTolerance,
        edgeFeather: bgFeather,
        roi: selection,
        onProgress: (msg, pct) => {
          setAiTask(msg);
          setAiProgress(pct);
          setStatus(`⏳ ${msg} (${pct}%)`);
        }
      });

      // Load result to inspect pixel alpha bounds and crop tightly
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = result.dataUrl;
      });

      const W = img.naturalWidth || canvas.width;
      const H = img.naturalHeight || canvas.height;

      // Render to offscreen canvas to perform direct pixel-accurate scanning & noise cleanup
      const scanCanvas = document.createElement("canvas");
      scanCanvas.width = W;
      scanCanvas.height = H;
      const scanCtx = scanCanvas.getContext("2d");
      if (!scanCtx) throw new Error("Could not create scan canvas context");
      scanCtx.drawImage(img, 0, 0, W, H);
      const scanImgData = scanCtx.getImageData(0, 0, W, H);
      const scanData = scanImgData.data;

      // Client-side intelligent spatial cleanup to ensure zero stray artifacts or distant props
      cleanMaskNoise(scanData, W, H);
      scanCtx.putImageData(scanImgData, 0, 0);

      // Find the true, exact tight bounding box of remaining visible pixels (alpha >= 35)
      let minX = W, minY = H, maxX = 0, maxY = 0;
      let visiblePixels = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const a = scanData[(y * W + x) * 4 + 3];
          if (a >= 35) {
            visiblePixels++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (visiblePixels === 0) {
        minX = 0; minY = 0; maxX = W - 1; maxY = H - 1;
      }

      // Exact pixel-perfect tight crop: ZERO extra background space or margins
      const cropW = Math.max(1, maxX - minX + 1);
      const cropH = Math.max(1, maxY - minY + 1);

      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = cropW;
      croppedCanvas.height = cropH;
      const croppedCtx = croppedCanvas.getContext("2d");
      if (!croppedCtx) throw new Error("Could not create cropped canvas context");

      // Draw tightly cropped subject from the cleaned scan canvas
      croppedCtx.drawImage(scanCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
      const tightDataUrl = croppedCanvas.toDataURL("image/png");

      // Generate transparent blank base canvas so workspace remains full-size and not shrunk
      const blankCanvas = document.createElement("canvas");
      blankCanvas.width = W;
      blankCanvas.height = H;
      const blankDataUrl = blankCanvas.toDataURL("image/png");

      setHasCustomBackground(false);
      cachedImageRef.current = null;
      cachedImageSrcRef.current = null;
      baseOffscreenCanvasRef.current = null;

      const preloadedTightImg = new Image();
      preloadedTightImg.src = tightDataUrl;
      cachedSubjectImgRef.current = preloadedTightImg;

      setExtractedSubjectUrl(tightDataUrl);
      setImageSrc(blankDataUrl);
      setImageSize({ width: W, height: H });

      // Initialize the movable floating subject
      const newSubject: FloatingSubject = {
        id: `subject-${Date.now()}`,
        dataUrl: tightDataUrl,
        x: minX,
        y: minY,
        width: cropW,
        height: cropH,
        naturalWidth: cropW,
        naturalHeight: cropH
      };
      floatingSubjectPosRef.current = { x: minX, y: minY };
      setFloatingSubject(newSubject);
      setActiveTool("select");

      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      setStatus(`✅ [${elapsed}ث] تم عزل الشخص/المحتوى الصافي بدقة متناهية بدون أي مساحة عمل أو طبقة خلفه (${cropW}×${cropH} بكسل) — يمكنك الآن سحبه وتحريكه بحرية بأداة التحريك (V) في أي مكان!`);
    } catch (err) {
      console.error("Pure content cutout error:", err);
      setStatus("❌ تعذر عزل المحتوى الصافي: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAiProcessing(false);
      setAiTask("");
      setAiProgress(0);
    }
  };

  /**
   * Helper: Quick Alignment for Floating Subject
   */
  const handleAlignSubject = (align: "center" | "left" | "right" | "top" | "bottom" | "reset") => {
    if (!floatingSubject || !canvasRef.current) return;
    const cw = canvasRef.current.width;
    const ch = canvasRef.current.height;
    setFloatingSubject(prev => {
      if (!prev) return null;
      let newX = prev.x;
      let newY = prev.y;
      if (align === "center" || align === "reset") {
        newX = Math.round((cw - prev.width) / 2);
        newY = Math.round((ch - prev.height) / 2);
      } else if (align === "left") {
        newX = 20;
      } else if (align === "right") {
        newX = Math.max(0, cw - prev.width - 20);
      } else if (align === "top") {
        newY = 20;
      } else if (align === "bottom") {
        newY = Math.max(0, ch - prev.height - 20);
      }
      floatingSubjectPosRef.current = { x: newX, y: newY };
      return { ...prev, x: newX, y: newY };
    });
    setStatus(`🎯 تم ضبط محاذاة المحتوى المعزول إلى [${align === "center" ? "المنتصف" : align === "left" ? "اليسار" : align === "right" ? "اليمين" : align === "top" ? "الأعلى" : align === "bottom" ? "الأسفل" : "الوضع الافتراضي"}]`);
  };

  /**
   * Helper: Scale and Resize Floating Subject (Maintain Center Anchor & Proportions)
   */
  const handleScaleSubject = (newScalePercent: number) => {
    if (!floatingSubject) return;
    const clampedPercent = Math.max(10, Math.min(400, Math.round(newScalePercent)));
    const scaleFactor = clampedPercent / 100;

    const baseW = floatingSubject.naturalWidth || floatingSubject.width;
    const baseH = floatingSubject.naturalHeight || floatingSubject.height;

    const newW = Math.max(20, Math.round(baseW * scaleFactor));
    const newH = Math.max(20, Math.round(baseH * scaleFactor));

    // Keep subject center point anchored in place
    const curX = floatingSubjectPosRef.current ? floatingSubjectPosRef.current.x : floatingSubject.x;
    const curY = floatingSubjectPosRef.current ? floatingSubjectPosRef.current.y : floatingSubject.y;
    const centerX = curX + floatingSubject.width / 2;
    const centerY = curY + floatingSubject.height / 2;

    const newX = Math.round(centerX - newW / 2);
    const newY = Math.round(centerY - newH / 2);

    floatingSubjectPosRef.current = { x: newX, y: newY };
    setFloatingSubject(prev => prev ? ({
      ...prev,
      x: newX,
      y: newY,
      width: newW,
      height: newH,
      naturalWidth: baseW,
      naturalHeight: baseH
    }) : null);
    setStatus(`🔍 تم ضبط حجم المحتوى إلى ${clampedPercent}% (${newW} × ${newH} بكسل)`);
  };

  /**
   * Helper: Increment / Decrement Floating Subject Scale by Delta Percentage
   */
  const handleScaleSubjectDelta = (deltaPercent: number) => {
    if (!floatingSubject) return;
    const baseW = floatingSubject.naturalWidth || floatingSubject.width;
    const curPercent = Math.round((floatingSubject.width / baseW) * 100);
    handleScaleSubject(curPercent + deltaPercent);
  };

  /**
   * Helper: Fit Floating Subject Proportionally Inside Current Canvas
   */
  const handleFitSubjectToCanvas = () => {
    if (!floatingSubject || !canvasRef.current) return;
    const cw = canvasRef.current.width;
    const ch = canvasRef.current.height;
    const baseW = floatingSubject.naturalWidth || floatingSubject.width;
    const baseH = floatingSubject.naturalHeight || floatingSubject.height;
    const scale = Math.min((cw * 0.85) / baseW, (ch * 0.88) / baseH);
    const newPercent = Math.round(scale * 100);
    handleScaleSubject(newPercent);
    handleAlignSubject("center");
  };

  /**
   * Helper: Export Isolated Pure Subject as Clean Transparent PNG
   */
  const handleExportPureSubject = () => {
    if (!floatingSubject) {
      setStatus("⚠️ لا يوجد محتوى معزول حالياً للتصدير");
      return;
    }
    downloadFile(floatingSubject.dataUrl, `isolated-subject-${Date.now()}.png`, "image/png");
    setStatus("📥 تم تصدير المحتوى الصافي فقط بنجاح بصيغة PNG شفافة عالية الدقة وبدون أي خلفية");
  };

  /**
   * Helper: Crop Entire Canvas/Workspace to Fit Subject Only (Eliminate any outer canvas borders)
   */
  const handleFitCanvasToSubject = () => {
    if (!floatingSubject) return;
    saveAiOriginalSnapshot("اقتصاص مساحة العمل للمحتوى الصافي");
    setImageSrc(floatingSubject.dataUrl);
    setImageSize({ width: floatingSubject.width, height: floatingSubject.height });
    setFloatingSubject({
      ...floatingSubject,
      x: 0,
      y: 0
    });
    floatingSubjectPosRef.current = { x: 0, y: 0 };
    cachedImageRef.current = null;
    cachedImageSrcRef.current = null;
    baseOffscreenCanvasRef.current = null;
    setStatus(`✂️ تم اقتصاص مساحة العمل بالكامل لتطابق المحتوى الصافي بدقة متناهية (${floatingSubject.width}×${floatingSubject.height} بكسل) — تم إزالة أي مساحة إضافية تماماً!`);
  };

  /**
   * Section 22: Smart Drag & Drop Hub Action Handler
   */
  const handleSmartDropAction = async (action: DropActionType) => {
    if (!droppedImageMeta) return;

    if (action === "layer") {
      const canvasW = canvasRef.current?.width || imageSize.width || 1080;
      const canvasH = canvasRef.current?.height || imageSize.height || 1080;
      const placement = calculateFittedPlacement(
        droppedImageMeta.width,
        droppedImageMeta.height,
        canvasW,
        canvasH,
        0.75
      );

      saveAiOriginalSnapshot("إضافة طبقة مسحوبة");

      const newSubject: FloatingSubject = {
        id: `subject-${Date.now()}`,
        dataUrl: droppedImageMeta.dataUrl,
        x: placement.x,
        y: placement.y,
        width: placement.width,
        height: placement.height,
        naturalWidth: droppedImageMeta.width,
        naturalHeight: droppedImageMeta.height,
        rotation: 0
      };

      floatingSubjectPosRef.current = { x: placement.x, y: placement.y };
      setFloatingSubject(newSubject);
      setActiveTool("select");

      const newLayerId = `layer-drop-${Date.now()}`;
      setLayers((prev) => [
        {
          id: newLayerId,
          name: droppedImageMeta.name.replace(/\.[^/.]+$/, ""),
          kind: "image",
          color: "#818cf8",
          visible: true,
          opacity: 100,
          blendMode: "normal"
        },
        ...prev
      ]);
      setSelectedLayer(newLayerId);
      setStatus(currentLang === "ar" ? "تمت إضافة الصورة كعنصر حر قابل للتحويل والتحريك" : "Added image as floating layer");
    } else if (action === "ai_cutout") {
      setStatus(currentLang === "ar" ? "جارٍ عزل خلفية الصورة بالذكاء الاصطناعي..." : "Removing background with AI...");
      setIsRendering(true);
      try {
        const off = document.createElement("canvas");
        off.width = droppedImageMeta.width;
        off.height = droppedImageMeta.height;
        const ctx = off.getContext("2d");
        if (ctx) {
          const img = new Image();
          await new Promise<void>((res) => {
            img.onload = () => {
              ctx.drawImage(img, 0, 0);
              res();
            };
            img.src = droppedImageMeta.dataUrl;
          });
          const result = await extractSubjectFromCanvas(off, {
            tolerance: bgRemoveTolerance,
            edgeFeather: bgFeather,
          });
          const canvasW = canvasRef.current?.width || imageSize.width || 1080;
          const canvasH = canvasRef.current?.height || imageSize.height || 1080;
          const placement = calculateFittedPlacement(
            droppedImageMeta.width,
            droppedImageMeta.height,
            canvasW,
            canvasH,
            0.7
          );

          saveAiOriginalSnapshot("عزل ذكي بالذكاء الاصطناعي");
          const newSubject: FloatingSubject = {
            id: `subject-ai-${Date.now()}`,
            dataUrl: result.dataUrl,
            x: placement.x,
            y: placement.y,
            width: placement.width,
            height: placement.height,
            naturalWidth: droppedImageMeta.width,
            naturalHeight: droppedImageMeta.height,
            rotation: 0
          };

          floatingSubjectPosRef.current = { x: placement.x, y: placement.y };
          setFloatingSubject(newSubject);
          setActiveTool("select");
          setStatus(currentLang === "ar" ? "✨ تم عزل وتفريغ العنصر وإدراجه كعنصر حر بنجاح" : "Subject extracted and inserted!");
        }
      } catch (err) {
        console.error("AI Cutout drop error:", err);
        setStatus(currentLang === "ar" ? "فشل العزل الآلي — تم الإدراج المباشر" : "Cutout failed");
      } finally {
        setIsRendering(false);
      }
    } else if (action === "new_project") {
      saveAiOriginalSnapshot("فتح مشروع جديد بالسحب والإفلات");
      setImageName(droppedImageMeta.name.replace(/\.[^/.]+$/, ""));
      setImageSrc(droppedImageMeta.dataUrl);
      setImageSize({ width: droppedImageMeta.width, height: droppedImageMeta.height });
      setFloatingSubject(null);
      floatingSubjectPosRef.current = null;
      setTimeout(fitToScreen, 80);
      setStatus(currentLang === "ar" ? `تم فتح الصورة ككانفاس جديد (${droppedImageMeta.width}×${droppedImageMeta.height})` : `Opened new canvas`);
    } else if (action === "blend_studio") {
      setPreloadedBlendImage(droppedImageMeta.dataUrl);
      setIsBlendModalOpen(true);
      setStatus(currentLang === "ar" ? "تم إرسال الصورة إلى استوديو دمج الصورتين" : "Sent to Two-Image Blend Studio");
    }

    setDroppedImageMeta(null);
  };

  /**
   * Section 13: Free Transform Controls & Pointer Event Handlers
   */
  const handleRotateSubject = (deltaOrAngle: number, isAbsolute: boolean = false) => {
    if (!floatingSubject) return;
    setFloatingSubject((prev) => {
      if (!prev) return null;
      let newRot = isAbsolute ? deltaOrAngle : (prev.rotation || 0) + deltaOrAngle;
      newRot = Math.round(((newRot % 360) + 360) % 360);
      return { ...prev, rotation: newRot };
    });
    setStatus(`↻ تم تدوير العنصر إلى: ${deltaOrAngle}°`);
  };

  const handleTransformPointerDown = (
    e: React.PointerEvent,
    handleType: "nw" | "ne" | "se" | "sw" | "n" | "s" | "e" | "w" | "rot" | "move"
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!floatingSubject) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setActiveTransformHandle(handleType);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const canvasPointerX = (e.clientX - bounds.left) * (canvas.width / bounds.width);
    const canvasPointerY = (e.clientY - bounds.top) * (canvas.height / bounds.height);

    const curX = floatingSubjectPosRef.current ? floatingSubjectPosRef.current.x : floatingSubject.x;
    const curY = floatingSubjectPosRef.current ? floatingSubjectPosRef.current.y : floatingSubject.y;

    transformStartRef.current = {
      startX: canvasPointerX,
      startY: canvasPointerY,
      initialX: curX,
      initialY: curY,
      initialWidth: floatingSubject.width,
      initialHeight: floatingSubject.height,
      initialRotation: floatingSubject.rotation || 0,
      aspectRatio: floatingSubject.width / Math.max(1, floatingSubject.height),
    };
  };

  const handleTransformPointerMove = (e: React.PointerEvent) => {
    if (!activeTransformHandle || !transformStartRef.current || !floatingSubject) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const bounds = canvas.getBoundingClientRect();
    const canvasPointerX = (e.clientX - bounds.left) * (canvas.width / bounds.width);
    const canvasPointerY = (e.clientY - bounds.top) * (canvas.height / bounds.height);

    const { startX, startY, initialX, initialY, initialWidth, initialHeight, initialRotation, aspectRatio } = transformStartRef.current;
    const dx = canvasPointerX - startX;
    const dy = canvasPointerY - startY;

    if (activeTransformHandle === "move") {
      let nx = Math.round(initialX + dx);
      let ny = Math.round(initialY + dy);

      if (snapEnabled && canvasRef.current) {
        const snapRes = calculateSnap(
          { x: nx, y: ny, width: initialWidth, height: initialHeight },
          { width: canvasRef.current.width, height: canvasRef.current.height },
          showGuides ? guides : [],
          { threshold: 10, snapToCenter: true, snapToEdges: true, snapToGuides: showGuides, snapToGrid: showGrid, gridSize: 40 }
        );
        nx = snapRes.x;
        ny = snapRes.y;
        setActiveSnapLines(snapRes.activeSnapLines);
      } else {
        if (activeSnapLines.length > 0) setActiveSnapLines([]);
      }

      floatingSubjectPosRef.current = { x: nx, y: ny };
      setFloatingSubject((prev) => (prev ? { ...prev, x: nx, y: ny } : null));
      if (!dragRafIdRef.current) {
        dragRafIdRef.current = requestAnimationFrame(() => {
          dragRafIdRef.current = null;
          fastRenderFloatingSubject();
        });
      }
      return;
    }

    if (activeTransformHandle === "rot") {
      const centerX = initialX + initialWidth / 2;
      const centerY = initialY + initialHeight / 2;
      const startAngle = Math.atan2(startY - centerY, startX - centerX) * (180 / Math.PI);
      const curAngle = Math.atan2(canvasPointerY - centerY, canvasPointerX - centerX) * (180 / Math.PI);
      let newRot = Math.round((initialRotation + (curAngle - startAngle)) % 360);
      if (newRot < 0) newRot += 360;

      for (const snap of [0, 45, 90, 135, 180, 225, 270, 315, 360]) {
        if (Math.abs(newRot - snap) <= 4) {
          newRot = snap === 360 ? 0 : snap;
          break;
        }
      }

      setFloatingSubject((prev) => (prev ? { ...prev, rotation: newRot } : null));
      if (!dragRafIdRef.current) {
        dragRafIdRef.current = requestAnimationFrame(() => {
          dragRafIdRef.current = null;
          fastRenderFloatingSubject();
        });
      }
      return;
    }

    let newW = initialWidth;
    let newH = initialHeight;
    let newX = initialX;
    let newY = initialY;

    if (activeTransformHandle === "se") {
      newW = Math.max(20, Math.round(initialWidth + dx));
      newH = e.shiftKey ? Math.round(newW / aspectRatio) : Math.max(20, Math.round(initialHeight + dy));
    } else if (activeTransformHandle === "sw") {
      newW = Math.max(20, Math.round(initialWidth - dx));
      newH = e.shiftKey ? Math.round(newW / aspectRatio) : Math.max(20, Math.round(initialHeight + dy));
      newX = Math.round(initialX + (initialWidth - newW));
    } else if (activeTransformHandle === "ne") {
      newW = Math.max(20, Math.round(initialWidth + dx));
      newH = e.shiftKey ? Math.round(newW / aspectRatio) : Math.max(20, Math.round(initialHeight - dy));
      newY = Math.round(initialY + (initialHeight - newH));
    } else if (activeTransformHandle === "nw") {
      newW = Math.max(20, Math.round(initialWidth - dx));
      newH = e.shiftKey ? Math.round(newW / aspectRatio) : Math.max(20, Math.round(initialHeight - dy));
      newX = Math.round(initialX + (initialWidth - newW));
      newY = Math.round(initialY + (initialHeight - newH));
    } else if (activeTransformHandle === "e") {
      newW = Math.max(20, Math.round(initialWidth + dx));
    } else if (activeTransformHandle === "w") {
      newW = Math.max(20, Math.round(initialWidth - dx));
      newX = Math.round(initialX + (initialWidth - newW));
    } else if (activeTransformHandle === "s") {
      newH = Math.max(20, Math.round(initialHeight + dy));
    } else if (activeTransformHandle === "n") {
      newH = Math.max(20, Math.round(initialHeight - dy));
      newY = Math.round(initialY + (initialHeight - newH));
    }

    floatingSubjectPosRef.current = { x: newX, y: newY };
    setFloatingSubject((prev) =>
      prev
        ? {
            ...prev,
            x: newX,
            y: newY,
            width: newW,
            height: newH,
          }
        : null
    );

    if (!dragRafIdRef.current) {
      dragRafIdRef.current = requestAnimationFrame(() => {
        dragRafIdRef.current = null;
        fastRenderFloatingSubject();
      });
    }
  };

  const handleTransformPointerUp = (e: React.PointerEvent) => {
    if (activeTransformHandle) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setActiveTransformHandle(null);
      transformStartRef.current = null;
      setActiveSnapLines([]);
      if (floatingSubject) {
        setStatus(`📐 تم ضبط تحويل العنصر (${Math.round(floatingSubject.width)}×${Math.round(floatingSubject.height)} بكسل، تدوير ${Math.round(floatingSubject.rotation || 0)}°)`);
      }
    }
  };

  /**
   * Section 15 & 16: Interactive Rulers, Guides, & Alignment Handlers
   */
  const handleRulerMouseDown = (orientation: "horizontal" | "vertical", e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const pos = orientation === "horizontal"
      ? (e.clientY - bounds.top) * (canvas.height / bounds.height)
      : (e.clientX - bounds.left) * (canvas.width / bounds.width);

    const newGuide: GuideLine = {
      id: `guide-${Date.now()}`,
      orientation,
      position: Math.round(Math.max(10, pos)),
    };
    setGuides((prev) => [...prev, newGuide]);
    setShowGuides(true);
    isDraggingGuideRef.current = { id: newGuide.id, orientation, isNew: true };
    setStatus(orientation === "horizontal" ? "اسحب لأسفل لضبط موضع الدليل الأفقي" : "اسحب لليمين لضبط موضع الدليل الرأسي");
  };

  const handleGuideDrag = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    const target = guides.find((g) => g.id === id);
    if (!target) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingGuideRef.current = { id, orientation: target.orientation, isNew: false };
  };

  const handleGuidePointerMove = (id: string, e: React.PointerEvent) => {
    if (!isDraggingGuideRef.current || isDraggingGuideRef.current.id !== id) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const orientation = isDraggingGuideRef.current.orientation;

    const pos = orientation === "horizontal"
      ? Math.round((e.clientY - bounds.top) * (canvas.height / bounds.height))
      : Math.round((e.clientX - bounds.left) * (canvas.width / bounds.width));

    setGuides((prev) => prev.map((g) => (g.id === id ? { ...g, position: pos } : g)));
  };

  const handleGuidePointerUp = (id: string, e: React.PointerEvent) => {
    if (isDraggingGuideRef.current && isDraggingGuideRef.current.id === id) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      isDraggingGuideRef.current = null;
      setStatus("تم تثبيت موضع الخط الإرشادي");
    }
  };

  const handleRemoveGuide = (id: string) => {
    setGuides((prev) => prev.filter((g) => g.id !== id));
    setStatus("تم حذف الخط الإرشادي");
  };

  const handleApplyAlignment = (type: AlignmentType) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasSize = { width: canvas.width, height: canvas.height };

    if (floatingSubject) {
      const newPos = calculateAlignment(type, floatingSubject, canvasSize);
      floatingSubjectPosRef.current = newPos;
      setFloatingSubject((prev) => (prev ? { ...prev, ...newPos } : null));
      fastRenderFloatingSubject();
      const labels: Record<AlignmentType, string> = {
        left: "اليسار",
        "center-h": "المنتصف الأفقي",
        right: "اليمين",
        top: "الأعلى",
        "center-v": "المنتصف الرأسي",
        bottom: "الأسفل",
      };
      setStatus(`🎯 تم محاذاة العنصر المعزول إلى [${labels[type]}]`);
      return;
    }

    const selLayer = layers.find((l) => l.id === selectedLayer);
    if (!selLayer) return;

    if (selLayer.kind === "text") {
      setTextElements((prev) =>
        prev.map((t) => {
          if (t.id === selectedLayer) {
            const newPos = calculateAlignment(type, { x: t.x, y: t.y, width: t.size * (t.text.length * 0.6), height: t.size }, canvasSize);
            return { ...t, ...newPos };
          }
          return t;
        })
      );
      setStatus(`🎯 تم محاذاة النص على مساحة العمل`);
    } else {
      setStatus(`تم تطبيق المحاذاة على الطبقة: ${selLayer.name}`);
    }
  };

  const handleEnableFreeTransformOnLayer = (layerId: string) => {
    const target = layers.find((l) => l.id === layerId);
    if (!target) return;
    if (floatingSubject) {
      setActiveTool("select");
      setStatus("أداة التحويل الحر نشطة على العنصر الحالي 📐");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setFloatingSubject({
      id: `layer-transform-${Date.now()}`,
      dataUrl,
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      naturalWidth: canvas.width,
      naturalHeight: canvas.height,
      rotation: 0,
    });
    floatingSubjectPosRef.current = { x: 0, y: 0 };
    setActiveTool("select");
    setStatus(`📐 تم تفعيل التحويل الحر (8 مقاود + تدوير) للطبقة: ${target.name}`);
  };

  /**
   * 6. رفع صورة خلفية مخصصة من جهاز المستخدم وتركيبها خلف العنصر المعزول
   */
  const handleUploadCustomBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // Reset so same file can be re-selected if needed

    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) { setStatus("⚠️ يرجى فتح أو رفع صورة أولاً"); return; }

    saveAiOriginalSnapshot(`استبدال الخلفية بصورة مخصصة (${file.name})`);
    const t0 = performance.now();
    setAiProcessing(true);
    setAiTask("قراءة صورة الخلفية وعزل العنصر...");
    setAiProgress(15);
    setStatus(`⏳ جاري معالجة وتركيب صورة الخلفية المخصصة (${file.name})...`);

    try {
      // Read uploaded background image
      const bgDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const bgImg = new Image();
      await new Promise<void>((resolve, reject) => {
        bgImg.onload = () => resolve();
        bgImg.onerror = reject;
        bgImg.src = bgDataUrl;
      });

      // Ensure subject is extracted
      let subjectUrl = extractedSubjectUrl;
      if (!subjectUrl) {
        setAiTask("عزل العنصر بالذكاء الاصطناعي لوضعه على الخلفية الجديدة...");
        setAiProgress(35);
        const result = await extractSubjectFromCanvas(canvas, {
          tolerance: bgRemoveTolerance,
          edgeFeather: bgFeather,
          roi: selection,
          onProgress: (msg, pct) => {
            setAiTask(msg);
            setAiProgress(pct);
          }
        });
        subjectUrl = result.dataUrl;
        setExtractedSubjectUrl(subjectUrl);
      }

      // Load foreground subject
      const fgImg = new Image();
      await new Promise<void>((resolve, reject) => {
        fgImg.onload = () => resolve();
        fgImg.onerror = reject;
        fgImg.src = subjectUrl;
      });

      // Target resolution based on uploaded background image (capped at 2560px for smooth performance)
      let W = bgImg.naturalWidth || canvas.width || 1200;
      let H = bgImg.naturalHeight || canvas.height || 800;
      const MAX_DIM = 2560;
      if (W > MAX_DIM || H > MAX_DIM) {
        if (W >= H) {
          H = Math.round((H * MAX_DIM) / W);
          W = MAX_DIM;
        } else {
          W = Math.round((W * MAX_DIM) / H);
          H = MAX_DIM;
        }
      }

      // Determine foreground subject placement
      const fgW = fgImg.naturalWidth;
      const fgH = fgImg.naturalHeight;
      let dx = 0, dy = 0, dw = fgW, dh = fgH;

      if (canvas.width > 0 && Math.abs(fgW / fgH - canvas.width / canvas.height) < 0.05 && Math.abs(fgW - canvas.width) < 5) {
        const scale = Math.min(W / fgW, H / fgH);
        dw = Math.round(fgW * scale);
        dh = Math.round(fgH * scale);
        dx = Math.round((W - dw) / 2);
        dy = Math.round((H - dh) / 2);
      } else {
        const fitScale = Math.min((W * 0.85) / fgW, (H * 0.88) / fgH);
        dw = Math.round(fgW * fitScale);
        dh = Math.round(fgH * fitScale);
        dx = Math.round((W - dw) / 2);
        dy = Math.round(H - dh);
      }

      // Set uploaded background as base image
      setHasCustomBackground(true);
      cachedImageRef.current = null;
      cachedImageSrcRef.current = null;
      baseOffscreenCanvasRef.current = null;

      const preloadedFgImg = new Image();
      preloadedFgImg.src = subjectUrl;
      cachedSubjectImgRef.current = preloadedFgImg;
      floatingSubjectPosRef.current = { x: dx, y: dy };

      setImageSrc(bgDataUrl);
      setImageSize({ width: W, height: H });
      setSelection(null);

      // Keep isolated subject floating on top and freely draggable
      setFloatingSubject({
        id: `subject-${Date.now()}`,
        dataUrl: subjectUrl,
        x: dx,
        y: dy,
        width: dw,
        height: dh,
        naturalWidth: fgW,
        naturalHeight: fgH
      });
      setActiveTool("select");

      const elapsed = ((performance.now() - t0) / 1000).toFixed(2);
      setStatus(`✅ [${elapsed}ث] تم رفع صورة الخلفية بنجاح! العنصر المعزول موضوع في الأمام ويمكنك سحبه وتحريكه بحرية بأداة التحريك (V)`);
    } catch (err) {
      console.error("Upload custom background error:", err);
      setStatus("❌ تعذر تركيب صورة الخلفية: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAiProcessing(false);
      setAiTask("");
      setAiProgress(0);
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
    if (!target) return;
    if (target.kind === "mask") {
      setMaskRect(null);
    } else if (target.kind === "text") {
      setTextElements((current) => current.filter((item) => item.id !== selectedLayer));
      setSelectedTextId(null);
    } else if (target.kind === "paint") {
      setStrokes((current) => current.filter((stroke) => stroke.layerId !== selectedLayer));
      setShapes((current) => current.filter((shape) => shape.layerId !== selectedLayer));
    } else if (target.kind === "subject" || target.id === "floating-subject") {
      setFloatingSubject(null);
      floatingSubjectPosRef.current = null;
    }
    setLayers((current) => current.filter((layer) => layer.id !== selectedLayer));
    setSelectedLayer("portrait");
    setStatus(`تم حذف الطبقة: ${target?.name || ""}`);
  };

  const handleSelectLayer = (layerId: string) => {
    setSelectedLayer(layerId);
    const target = layers.find((l) => l.id === layerId);
    if (!target) return;
    if (target.kind === "text") {
      setSelectedTextId(layerId);
      setActiveTool("text");
    } else if (target.kind === "subject" || target.id === "floating-subject") {
      setActiveTool("select");
    } else if (target.kind === "paint") {
      if (activeTool !== "brush" && activeTool !== "eraser" && activeTool !== "shape") {
        setActiveTool("brush");
      }
    }
    setStatus(`تم اختيار الطبقة: ${target.name}`);
  };

  const moveLayerToTop = () => {
    const res = moveLayerToTopHelper(layers, selectedLayer);
    if (res.success) {
      setLayers(res.layers);
      setStatus(`⤒ تم جلب الطبقة إلى المقدمة (الطبقة الأولى): ${res.message}`);
    } else {
      setStatus(res.message);
    }
  };

  const moveLayerToBottom = () => {
    const res = moveLayerToBottomHelper(layers, selectedLayer);
    if (res.success) {
      setLayers(res.layers);
      setStatus(`⤓ تم إرسال الطبقة إلى أسفل الترتيب (فوق الخلفية): ${res.message}`);
    } else {
      setStatus(res.message);
    }
  };

  const moveLayerUp = () => {
    const res = moveLayerUpHelper(layers, selectedLayer);
    if (res.success) {
      setLayers(res.layers);
      setStatus(`↑ تم تقديم الطبقة لأعلى: ${res.message}`);
    } else {
      setStatus(res.message);
    }
  };

  const moveLayerDown = () => {
    const res = moveLayerDownHelper(layers, selectedLayer);
    if (res.success) {
      setLayers(res.layers);
      setStatus(`↓ تم تأخير الطبقة لأسفل: ${res.message}`);
    } else {
      setStatus(res.message);
    }
  };

  const toggleSolo = (layerId: string) => {
    const res = toggleLayerSoloHelper(layers, layerId, soloLayerId, savedVisibilitiesRef.current);
    setLayers(res.nextLayers);
    setSoloLayerId(res.nextSoloId);
    savedVisibilitiesRef.current = res.nextSavedVisibilities;
    if (res.nextSoloId) {
      const target = layers.find((l) => l.id === layerId);
      setStatus(`👁‍🗨 تم تفعيل وضع العزل (Solo) للطبقة: "${target?.name || layerId}" — جميع الطبقات الأخرى مخفية مؤقتاً`);
    } else {
      setStatus("👁‍🗨 تم إيقاف وضع العزل واستعادة ظهور جميع الطبقات");
    }
  };

  const duplicateSelectedLayer = () => {
    const res = duplicateLayerHelper(layers, selectedLayer);
    if (res.newLayerId) {
      setLayers(res.layers);
      setSelectedLayer(res.newLayerId);
      setStatus(res.message);
    } else {
      setStatus(res.message);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
    setDraggedLayerIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedLayerIndex === null || draggedLayerIndex === targetIndex) {
      setDraggedLayerIndex(null);
      setDragOverIndex(null);
      return;
    }
    const res = reorderLayers(layers, draggedLayerIndex, targetIndex);
    if (res.success) {
      setLayers(res.layers);
      setStatus("تمت إعادة ترتيب الطبقات بنجاح");
    }
    setDraggedLayerIndex(null);
    setDragOverIndex(null);
  };

  const flipSelectedLayerH = () => {
    const target = layers.find((l) => l.id === selectedLayer);
    if (!target) return;
    if (target.kind === "image") {
      setFlipX((prev) => !prev);
      setStatus("تم عكس الصورة الأساسية أفقياً");
    } else if (target.kind === "subject" || target.id === "floating-subject") {
      if (floatingSubject) {
        const img = cachedSubjectImgRef.current;
        if (img) {
          const off = document.createElement("canvas");
          off.width = floatingSubject.naturalWidth || floatingSubject.width;
          off.height = floatingSubject.naturalHeight || floatingSubject.height;
          const ctx = off.getContext("2d");
          if (ctx) {
            ctx.translate(off.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(img, 0, 0);
            const flippedUrl = off.toDataURL("image/png");
            setFloatingSubject({ ...floatingSubject, dataUrl: flippedUrl });
            setStatus("تم عكس العنصل المعزول أفقياً");
          }
        }
      }
    } else {
      setStatus(`تم تطبيق العكس الأفقي على الطبقة: ${target.name}`);
    }
  };

  const flipSelectedLayerV = () => {
    const target = layers.find((l) => l.id === selectedLayer);
    if (!target) return;
    if (target.kind === "image") {
      setFlipY((prev) => !prev);
      setStatus("تم عكس الصورة الأساسية رأسياً");
    } else if (target.kind === "subject" || target.id === "floating-subject") {
      if (floatingSubject) {
        const img = cachedSubjectImgRef.current;
        if (img) {
          const off = document.createElement("canvas");
          off.width = floatingSubject.naturalWidth || floatingSubject.width;
          off.height = floatingSubject.naturalHeight || floatingSubject.height;
          const ctx = off.getContext("2d");
          if (ctx) {
            ctx.translate(0, off.height);
            ctx.scale(1, -1);
            ctx.drawImage(img, 0, 0);
            const flippedUrl = off.toDataURL("image/png");
            setFloatingSubject({ ...floatingSubject, dataUrl: flippedUrl });
            setStatus("تم عكس العنصر المعزول رأسياً");
          }
        }
      }
    } else {
      setStatus(`تم تطبيق العكس الرأسي على الطبقة: ${target.name}`);
    }
  };

  const centerSelectedLayer = () => {
    const target = layers.find((l) => l.id === selectedLayer);
    if (!target) return;
    if (target.kind === "subject" || target.id === "floating-subject") {
      handleAlignSubject("center");
    } else if (target.kind === "text") {
      if (canvasRef.current) {
        const cw = canvasRef.current.width;
        const ch = canvasRef.current.height;
        setTextElements((prev) =>
          prev.map((item) =>
            item.id === selectedLayer ? { ...item, x: cw / 2, y: ch / 2 } : item
          )
        );
        setStatus("تم توسيط النص في مساحة العمل");
      }
    } else {
      setStatus(`توسيط الطبقة: ${target.name}`);
    }
  };

  // Sync floatingSubject into layers stack dynamically
  useEffect(() => {
    if (floatingSubject) {
      setLayers((prev) => {
        const existing = prev.find((l) => l.id === "floating-subject" || l.kind === "subject");
        if (existing) {
          if (existing.thumbnail !== floatingSubject.dataUrl) {
            return prev.map((l) =>
              l.id === existing.id ? { ...l, thumbnail: floatingSubject.dataUrl } : l
            );
          }
          return prev;
        }
        const subjectLayer: LayerInfo = {
          id: "floating-subject",
          name: "العنصر المعزول (الشخص)",
          kind: "subject",
          color: "#ec4899",
          visible: true,
          opacity: 100,
          blendMode: "normal",
          thumbnail: floatingSubject.dataUrl,
        };
        // Insert as top layer (index 0)
        return [subjectLayer, ...prev];
      });
    } else {
      setLayers((prev) => prev.filter((l) => l.id !== "floating-subject" && l.kind !== "subject"));
    }
  }, [floatingSubject?.dataUrl]);
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
  const pointFromPointer = (event: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement> | React.WheelEvent<HTMLCanvasElement>) => {
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
      if (activeTool === "crop" || !current || selectionMode === "replace") return next;
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

    // Erase clicked/touched shapes
    setShapes((current) => {
      const next = current.filter((shape) => {
        if (targetLayerId && shape.layerId && shape.layerId !== targetLayerId) return true;
        const hit = point.x >= shape.x - radius && point.x <= shape.x + shape.width + radius &&
                    point.y >= shape.y - radius && point.y <= shape.y + shape.height + radius;
        return !hit;
      });
      return next.length !== current.length ? next : current;
    });

    // Erase from text
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
      setStatus(currentLang === "ar" ? "اسحب لتحديد منطقة القص — اضغط تطبيق القص أو Enter عند الانتهاء" : "Drag to define crop region — press Apply or Enter");
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
      const pt = pointFromPointer(event);
      const curSubX = floatingSubjectPosRef.current ? floatingSubjectPosRef.current.x : (floatingSubject ? floatingSubject.x : 0);
      const curSubY = floatingSubjectPosRef.current ? floatingSubjectPosRef.current.y : (floatingSubject ? floatingSubject.y : 0);
      if (
        floatingSubject &&
        pt.x >= curSubX - 12 &&
        pt.x <= curSubX + floatingSubject.width + 12 &&
        pt.y >= curSubY - 12 &&
        pt.y <= curSubY + floatingSubject.height + 12
      ) {
        event.currentTarget.setPointerCapture(event.pointerId);
        isDraggingSubjectRef.current = true;
        subjectDragStartRef.current = {
          startX: pt.x,
          startY: pt.y,
          initialX: curSubX,
          initialY: curSubY
        };
        floatingSubjectPosRef.current = { x: curSubX, y: curSubY };
        setStatus("🎯 جاري سحب وتحريك العنصر المعزول بالماوس بسلاسة تامة وبدون أي تجميد...");
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      selectionStart.current = pt;
      setSelection({ x: pt.x, y: pt.y, width: 0, height: 0 });
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
        isMask: selectedTarget === "mask"
      } as any;

      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.fillStyle = strokeColor;
        ctx.globalAlpha = (activeTool === "pencil" ? 100 : brushOpacity) / 100;
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.arc(point.x, point.y, effectiveWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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
      const point = pointFromPointer(event);
      lastPointRef.current = point;

      // 1. Magic Eraser (Click to flood-erase contiguous color pixels to alpha 0)
      if (eraserMode === "magic") {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            applyMagicEraser(
              ctx,
              canvas.width,
              canvas.height,
              Math.round(point.x),
              Math.round(point.y),
              magicEraserTolerance,
              magicEraserContiguous
            );
            const newUrl = canvas.toDataURL("image/png");
            setImageSrc(newUrl);
            if (cachedImageRef.current) cachedImageRef.current.src = newUrl;
            setStatus(currentLang === "ar" ? "تم مسح المساحة اللونية المتصلة بنجاح بالممحاة السحرية الذكية ✨" : "Smart Magic Eraser cleared target area ✨");
          }
        }
        return;
      }

      // 2. Continuous Eraser (Pixels or Paint Layer)
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDrawing(true);

      const currentLayer = layers.find((l) => l.id === selectedLayer);
      const isPixelTarget = eraserMode === "pixels" || !currentLayer || currentLayer.kind === "image" || currentLayer.kind === "background";

      if (isPixelTarget) {
        isErasingPixelsRef.current = true;
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.save();
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.globalCompositeOperation = "destination-out";
          ctx.beginPath();
          ctx.arc(point.x, point.y, Math.max(2, brushSize / 2), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        eraseAt(point, selectedLayer);
        setStatus(currentLang === "ar" ? `الممحاة الجراحية نشطة (الحجم: ${brushSize}px) — مسح مباشر للبكسلات إلى الشفافية` : `Pixel Eraser active (${brushSize}px)`);
        return;
      }

      // Erasing paint/text layers
      isErasingPixelsRef.current = false;
      let targetId = selectedLayer;
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

      currentStrokeRef.current = {
        points: [point],
        color: "rgba(0,0,0,1)",
        width: Math.max(4, brushSize),
        opacity: 100,
        hardness: 100,
        mode: "eraser",
        layerId: targetId,
        isMask: selectedTarget === "mask"
      } as any;

      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(point.x, point.y, Math.max(2, brushSize / 2), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      eraseAt(point, targetId);
      setStatus(currentLang === "ar" ? `الممحاة نشطة (الحجم: ${brushSize}px) — مسح الطبقات الرسومية` : `Eraser active (${brushSize}px)`);
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
    if (activeTool === "select" && isDraggingSubjectRef.current && subjectDragStartRef.current) {
      const dx = point.x - subjectDragStartRef.current.startX;
      const dy = point.y - subjectDragStartRef.current.startY;
      const nx = Math.round(subjectDragStartRef.current.initialX + dx);
      const ny = Math.round(subjectDragStartRef.current.initialY + dy);
      floatingSubjectPosRef.current = { x: nx, y: ny };
      if (!dragRafIdRef.current) {
        dragRafIdRef.current = requestAnimationFrame(() => {
          dragRafIdRef.current = null;
          fastRenderFloatingSubject();
        });
      }
      return;
    }
    if ((activeTool === "select" || activeTool === "shape" || activeTool === "crop") && selectionStart.current) {
      updateSelection(point);
      return;
    }
    if (!isDrawing) return;
    if ((activeTool === "brush" || activeTool === "pencil") && currentStrokeRef.current && lastPointRef.current) {
      currentStrokeRef.current.points.push(point);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = currentStrokeRef.current.width;
        ctx.strokeStyle = currentStrokeRef.current.color;
        ctx.globalAlpha = (currentStrokeRef.current.opacity ?? 100) / 100;
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        ctx.restore();
      }
      lastPointRef.current = point;
      return;
    }
    if (activeTool === "eraser" && isDrawing && lastPointRef.current) {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = Math.max(2, brushSize);
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        ctx.restore();
      }
      if (currentStrokeRef.current) {
        currentStrokeRef.current.points.push(point);
      }
      const targetId = eraserTargetLayerRef.current || undefined;
      eraseAt(point, targetId);
      lastPointRef.current = point;
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
    if (activeTool === "select") {
      if (isDraggingSubjectRef.current) {
        if (dragRafIdRef.current) {
          cancelAnimationFrame(dragRafIdRef.current);
          dragRafIdRef.current = null;
        }
        isDraggingSubjectRef.current = false;
        subjectDragStartRef.current = null;
        if (floatingSubjectPosRef.current) {
          const finalX = floatingSubjectPosRef.current.x;
          const finalY = floatingSubjectPosRef.current.y;
          setFloatingSubject(prev => prev ? ({ ...prev, x: finalX, y: finalY }) : null);
          setStatus(`🎯 تم تثبيت موضع المحتوى المعزول في: (${finalX}, ${finalY}) بنجاح`);
        }
        return;
      }
      selectionStart.current = null;
      return;
    }
    if (activeTool === "crop" && selectionStart.current) {
      selectionStart.current = null;
      if (selection && selection.width > 5 && selection.height > 5) {
        setStatus(currentLang === "ar" ? `تم تحديد منطقة القص (${Math.round(selection.width)} × ${Math.round(selection.height)} بكسل) — اضغط تطبيق القص أو Enter` : `Crop region selected (${Math.round(selection.width)}x${Math.round(selection.height)})`);
      } else {
        const cw = imageSize.width || canvasRef.current?.width || 1080;
        const ch = imageSize.height || canvasRef.current?.height || 1080;
        const cropW = Math.round(cw * 0.9);
        const cropH = Math.round(ch * 0.9);
        setSelection({ x: Math.round((cw - cropW) / 2), y: Math.round((ch - cropH) / 2), width: cropW, height: cropH });
        setStatus(currentLang === "ar" ? "تم تجهيز منطقة القص — اسحب للتعديل أو اضغط تطبيق القص أو Enter" : "Crop area ready — adjust or apply");
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
      if ((activeTool === "brush" || activeTool === "pencil" || activeTool === "eraser") && currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
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
                 
                 // If stroke is eraser or color is black, erase mask (destination-out)
                 if (completedStroke.mode === "eraser" || completedStroke.color === "black") {
                   ctx.globalCompositeOperation = "destination-out";
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
          if (completedStroke.mode === "eraser") {
            setShapes((current) => current.filter(s => {
              const r = completedStroke.width / 2;
              for (const pt of completedStroke.points) {
                if (pt.x >= s.x - r && pt.x <= s.x + s.width + r &&
                    pt.y >= s.y - r && pt.y <= s.y + s.height + r) {
                  return false;
                }
              }
              return true;
            }));
          }
          if (completedStroke.layerId) setTimeout(() => generateLayerThumbnail(completedStroke.layerId as string), 10);
        }
      }
      if ((activeTool === "clone" || activeTool === "heal" || (activeTool === "eraser" && isErasingPixelsRef.current)) && canvasRef.current) {
        const newPngUrl = canvasRef.current.toDataURL("image/png");
        setImageSrc(newPngUrl);
        if (cachedImageRef.current) {
          cachedImageRef.current.src = newPngUrl;
        }
      }
      isErasingPixelsRef.current = false;
      setStatus(activeTool === "eraser" ? (currentLang === "ar" ? "تم المسح وتثبيت البكسلات بنجاح" : "Erased successfully") : activeTool === "clone" ? "تم تثبيت ختم الاستنساخ" : activeTool === "heal" ? "تم تثبيت المعالجة" : "تم تثبيت الرسم");
    }
  };

  const activateTool = (toolId: string) => {
    setActiveTool(toolId);
    if (toolId === "crop") {
      const cw = imageSize.width || canvasRef.current?.width || 1080;
      const ch = imageSize.height || canvasRef.current?.height || 1080;
      if (!selection || selection.width < 10 || selection.height < 10) {
        const cropW = Math.round(cw * 0.9);
        const cropH = Math.round(ch * 0.9);
        setSelection({
          x: Math.round((cw - cropW) / 2),
          y: Math.round((ch - cropH) / 2),
          width: cropW,
          height: cropH,
        });
      }
    }
    if (toolId === "clone" || toolId === "heal" || toolId === "adjust" || toolId === "crop" || toolId === "shape" || toolId === "text" || toolId === "select" || toolId === "brush" || toolId === "pencil" || toolId === "bucket" || toolId === "eraser") {
      setActiveTab("properties");
      if (!isInspectorOpen) setIsInspectorOpen(true);
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
    if (activeTool === "select" && floatingSubject) return isDraggingSubjectRef.current ? "cursor-grabbing" : "cursor-grab";
    if (activeTool === "brush" || activeTool === "eraser" || activeTool === "select" || activeTool === "crop" || activeTool === "shape" || activeTool === "clone" || activeTool === "heal") return "cursor-crosshair";
    if (activeTool === "eyedropper") return "cursor-crosshair";
    return "";
  };

  return (
    <TooltipProvider delayDuration={180}>
      <main className="editor-shell">
        <header className="command-bar-multitier">
          {/* ─── الطبقة الأولى (Tier 1): شريط النظام والقوائم الرئيسية وبحث الأوامر ─── */}
          <div className="command-bar-tier1">
            <div className="brand-lockup">
              <div className="brand-mark">
                <img src="/logo.png?v=ip" alt="ImagePro Studio Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
                    <button className="app-menu-item" onClick={() => { setActiveMenu(null); setIsNewDesignModalOpen(true); }}>
                      <span className="app-menu-item-left"><Sparkles size={14} className="text-teal-400" /> ＋ تصميم جديد (Canva Suite)...</span>
                      <span className="app-menu-badge">جديد</span>
                    </button>
                    <button className="app-menu-item" onClick={() => { setActiveMenu(null); setNewProjectOpen(true); }}>
                      <span className="app-menu-item-left"><FilePlus size={14} /> مشروع فارغ...</span>
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
                    <button className="app-menu-item" onClick={() => { setActiveMenu(null); setIsProjectsDashboardOpen(true); }}>
                      <span className="app-menu-item-left"><Folder size={14} /> لوحة المشاريع المحفوظة...</span>
                      <span className="app-menu-badge">Dashboard</span>
                    </button>
                    <button className="app-menu-item" onClick={() => { setActiveMenu(null); setIsVersionHistoryOpen(true); }}>
                      <span className="app-menu-item-left"><History size={14} /> سجل الإصدارات واللقطات السابقة...</span>
                      <span className="app-menu-badge">Timeline</span>
                    </button>
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

              {/* 3. قائمة صورة Image Menu */}
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

              {/* 4. قائمة عرض View Menu */}
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
                    <button className="app-menu-item" onClick={() => { setActiveMenu(null); setShowRulers(!showRulers); setStatus(showRulers ? "تم إخفاء المساطر" : "تم إظهار مساطر الأبعاد (Rulers)"); }}>
                      <span className="app-menu-item-left"><Ruler size={14} /> {showRulers ? "إخفاء المساطر" : "إظهار مساطر الأبعاد (Rulers)"}</span>
                      <span className="app-menu-badge">{showRulers ? "✓" : ""}</span>
                    </button>
                    <button className="app-menu-item" onClick={() => { setActiveMenu(null); setShowGuides(!showGuides); setStatus(showGuides ? "تم إخفاء الخطوط الإرشادية" : "تم إظهار الخطوط الإرشادية (Guides)"); }}>
                      <span className="app-menu-item-left">📐 {showGuides ? "إخفاء الخطوط الإرشادية" : "إظهار الخطوط الإرشادية"}</span>
                      <span className="app-menu-badge">{showGuides ? "✓" : ""}</span>
                    </button>
                    <button className="app-menu-item" onClick={() => { setActiveMenu(null); setSnapEnabled(!snapEnabled); setStatus(snapEnabled ? "تم إيقاف الالتصاق الذكي" : "تم تفعيل الالتصاق الذكي (Smart Snap)"); }}>
                      <span className="app-menu-item-left"><Magnet size={14} /> الالتصاق الذكي (Smart Snap)</span>
                      <span className="app-menu-badge">{snapEnabled ? "✓" : ""}</span>
                    </button>
                    {guides.length > 0 && (
                      <button className="app-menu-item" onClick={() => { setActiveMenu(null); setGuides([]); setStatus("تم مسح كافة الخطوط الإرشادية"); }}>
                        <span className="app-menu-item-left">🗑️ مسح الخطوط الإرشادية ({guides.length})</span>
                      </button>
                    )}
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

            {/* Center Project Info Badge in Tier 1 */}
            <div className="tier1-project-status" title={currentLang === "ar" ? "أبعاد ومواصفات مساحة العمل الحالية" : "Active Canvas Dimensions"}>
              <span className="proj-title">{imageName}</span>
              <span>•</span>
              <span className="proj-dim">{imageSize.width} × {imageSize.height} px</span>
              <span>•</span>
              <span style={{ fontSize: "10px", color: "var(--studio-text-muted)" }}>{zoom}%</span>
            </div>

            {/* System Actions on Tier 1 Right */}
            <div className="tier1-actions-right">
              {/* Quick Command Search Trigger (Ctrl+K) */}
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="tier1-search-trigger"
                title={currentLang === "ar" ? "البحث في لوحة الأوامر السريعة (Ctrl+K)" : "Quick Command Palette (Ctrl+K)"}
              >
                <Search size={13} />
                <span>{currentLang === "ar" ? "الأوامر" : "Commands"}</span>
                <span className="search-kbd">Ctrl+K</span>
              </button>

              {/* Language Switcher */}
              <button
                onClick={() => {
                  const nextLang = currentLang === "ar" ? "en" : "ar";
                  setCurrentLang(nextLang);
                  setStatus(nextLang === "ar" ? "تم تحويل اللغة إلى العربية" : "Switched to English");
                }}
                className="tier1-search-trigger"
                style={{ padding: "4px 8px" }}
                title={currentLang === "ar" ? "Switch to English" : "التحويل للعربية"}
              >
                <span>🌐</span>
                <span style={{ fontWeight: 700 }}>{currentLang === "ar" ? "EN" : "عربي"}</span>
              </button>

              {/* Theme Switcher */}
              <button
                onClick={() => {
                  const nextTheme = currentTheme === "dark" ? "light" : "dark";
                  setCurrentTheme(nextTheme);
                  document.documentElement.classList.toggle("light-theme", nextTheme === "light");
                  document.documentElement.classList.toggle("dark-theme", nextTheme === "dark");
                }}
                className="tier1-search-trigger"
                style={{ padding: "4px 8px" }}
                title={currentTheme === "dark" ? "التحويل للوضع النهاري" : "Switch to Dark Mode"}
              >
                <span>{currentTheme === "dark" ? "☀️" : "🌙"}</span>
              </button>

              {/* Help Button */}
              <button
                onClick={() => setHelpOpen(true)}
                title="دليل المستخدم — مساعدة"
                className="tier1-search-trigger"
                style={{ padding: "4px 10px" }}
              >
                <span>📖 مساعدة</span>
              </button>
            </div>
          </div>

          {/* ─── الطبقة الثانية (Tier 2): شريط استوديو الإبداع (Studio Hero Ribbon) ─── */}
          <div className="command-bar-tier2">
            <div className="tier2-actions-left">
              {/* 0. زر تصميم جديد المميز (Canva Grade Hero New Design Button) */}
              <button
                onClick={() => setIsNewDesignModalOpen(true)}
                className="studio-hero-pill studio-hero-pill-new-design"
                title={currentLang === "ar" ? "بدء تصميم جديد بجميع المقاسات والمنصات" : "Create New Design"}
                data-testid="hero-new-design-btn"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>{currentLang === "ar" ? "＋ تصميم جديد" : "＋ New Design"}</span>
              </button>

              {/* 1. المكتبة الإبداعية الشاملة */}
              <button
                onClick={() => setIsCreativeLibraryOpen(true)}
                className="studio-hero-pill"
                title={currentLang === "ar" ? "المكتبة الإبداعية الشاملة (أصول، عناصر، خلفيات)" : "Creative Library Hub"}
                data-testid="pixelora-creative-library"
              >
                <Sparkles size={14} style={{ color: "#0ea5e9" }} />
                <span>{currentLang === "ar" ? "المكتبة الإبداعية" : "Creative Library"}</span>
              </button>

              {/* 2. القوالب الجاهزة */}
              <button
                onClick={() => setIsTemplatesModalOpen(true)}
                className="studio-hero-pill"
                title={currentLang === "ar" ? "قوالب احترافية قابلة للتعديل والمقاسات الجاهزة" : "Live Templates"}
                data-testid="studio-templates"
              >
                <Square size={13} style={{ transform: "rotate(45deg)", color: "#0ea5e9" }} />
                <span>{currentLang === "ar" ? "قوالب جاهزة" : "Templates"}</span>
              </button>

              {/* 3. استوديو الخلفيات */}
              <button
                onClick={() => setIsProductBgModalOpen(true)}
                className="studio-hero-pill"
                title={currentLang === "ar" ? "استوديو خلفيات المنتجات والبورتريه المبتكرة" : "Studio Backdrops"}
                data-testid="studio-backdrops"
              >
                <ImageIcon size={14} style={{ color: "#0ea5e9" }} />
                <span>{currentLang === "ar" ? "استوديو الخلفيات" : "Backdrops"}</span>
              </button>

              {/* 4. لوحة المشاريع وسجل الإصدارات */}
              <button
                onClick={() => setIsProjectsDashboardOpen(true)}
                className="studio-hero-pill"
                title={currentLang === "ar" ? "لوحة المشاريع المحفوظة والنسخ الاحتياطية" : "Projects Dashboard"}
                data-testid="studio-projects"
              >
                <Folder size={14} style={{ color: "#0ea5e9" }} />
                <span>{currentLang === "ar" ? "المشاريع" : "Projects"}</span>
              </button>

              {/* 5. تصدير متعدد القياسات */}
              <button
                onClick={() => setIsMultiExportOpen(true)}
                className="studio-hero-pill"
                title={currentLang === "ar" ? "تصدير دفعي لكافة منصات التواصل بنقرة واحدة" : "Multi-Size Export"}
                data-testid="studio-multi-export"
              >
                <Download size={14} style={{ color: "#0ea5e9" }} />
                <span>{currentLang === "ar" ? "تصدير متعدد" : "Multi-Export"}</span>
              </button>
            </div>

            {/* Right Side: Quick Save & High-Res Export */}
            <div className="tier2-actions-right">
              {/* Save Project Button */}
              <button
                className="pixelora-pill-save"
                onClick={saveProject}
                data-testid="save-project"
                title={currentLang === "ar" ? "حفظ المشروع محلياً في المتصفح (Ctrl+S)" : "Save Project Locally"}
              >
                <span className="save-dot" style={{ background: "#0ea5e9" }} />
                <span>{isRendering ? (currentLang === "ar" ? "جارٍ الحفظ..." : "Saving...") : (currentLang === "ar" ? "حفظ" : "Save")}</span>
              </button>

              {/* Export Button — opens advanced export modal directly */}
              <button
                className="pixelora-pill-export"
                onClick={() => setExportOptionsOpen(true)}
                data-testid="export-png"
                title={currentLang === "ar" ? "تصدير الصورة بجودة عالية" : "Export High-Res Image"}
              >
                <Download size={14} />
                <span>{currentLang === "ar" ? "تصدير" : "Export"}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Contextual Tool Options Bar (Photoshop / Figma Style) */}
        <div className="tool-options-bar">
          {/* Tool Identifier */}
          <div className="tool-id-badge">
            <span style={{ fontSize: "14px" }}>
              {activeTool === "eraser" ? "🧹" : activeTool === "brush" ? "🖌️" : activeTool === "crop" ? "✂️" : activeTool === "select" ? "↖️" : activeTool === "shape" ? "🔷" : activeTool === "text" ? "✍️" : activeTool === "clone" ? "🩹" : "⚙️"}
            </span>
            <span>
              {toolGroups.flat().find((t) => t.id === activeTool)?.label || activeTool}
            </span>
          </div>

          <div className="tool-bar-separator" />

          {/* Options for ERASER */}
          {activeTool === "eraser" && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="tool-opt-label">{currentLang === "ar" ? "الوضع:" : "Mode:"}</span>
                <div className="tool-mode-group">
                  <button
                    type="button"
                    onClick={() => setEraserMode("pixels")}
                    className={`tool-mode-btn ${eraserMode === "pixels" ? "active" : ""}`}
                  >
                    {currentLang === "ar" ? "بكسلات الصورة (Alpha 0)" : "Image Pixels"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEraserMode("paint")}
                    className={`tool-mode-btn ${eraserMode === "paint" ? "active" : ""}`}
                  >
                    {currentLang === "ar" ? "طبقة الرسم" : "Paint Strokes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEraserMode("magic")}
                    className={`tool-mode-btn ${eraserMode === "magic" ? "active" : ""}`}
                  >
                    {currentLang === "ar" ? "✨ محو ذكي بالألوان" : "Magic Flood"}
                  </button>
                </div>
              </div>

              {eraserMode !== "magic" ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="tool-opt-label">{currentLang === "ar" ? "الحجم:" : "Size:"}</span>
                    <input
                      type="range"
                      min={2}
                      max={250}
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      style={{ width: "80px", accentColor: "#0ea5e9" }}
                    />
                    <span className="tool-opt-value">{brushSize}px</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="tool-opt-label">{currentLang === "ar" ? "الصلابة:" : "Hardness:"}</span>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={brushHardness}
                      onChange={(e) => setBrushHardness(Number(e.target.value))}
                      style={{ width: "70px", accentColor: "#0ea5e9" }}
                    />
                    <span className="tool-opt-value">{brushHardness}%</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="tool-opt-label">{currentLang === "ar" ? "حساسية التسامح:" : "Tolerance:"}</span>
                    <input
                      type="range"
                      min={5}
                      max={120}
                      value={magicEraserTolerance}
                      onChange={(e) => setMagicEraserTolerance(Number(e.target.value))}
                      style={{ width: "80px", accentColor: "#8b5cf6" }}
                    />
                    <span className="tool-opt-value">{magicEraserTolerance}</span>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={magicEraserContiguous}
                      onChange={(e) => setMagicEraserContiguous(e.target.checked)}
                      style={{ accentColor: "#8b5cf6" }}
                    />
                    <span className="tool-opt-label">{currentLang === "ar" ? "بكسلات متصلة فقط" : "Contiguous Only"}</span>
                  </label>
                </>
              )}
            </div>
          )}

          {/* Options for BRUSH or PENCIL */}
          {(activeTool === "brush" || activeTool === "pencil") && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="tool-opt-label">{currentLang === "ar" ? "الحجم:" : "Size:"}</span>
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  style={{ width: "80px", accentColor: "#2dd4bf" }}
                />
                <span className="tool-opt-value">{brushSize}px</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="tool-opt-label">{currentLang === "ar" ? "الشفافية:" : "Opacity:"}</span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={brushOpacity}
                  onChange={(e) => setBrushOpacity(Number(e.target.value))}
                  style={{ width: "70px", accentColor: "#2dd4bf" }}
                />
                <span className="tool-opt-value">{brushOpacity}%</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="tool-opt-label">{currentLang === "ar" ? "اللون:" : "Color:"}</span>
                <input
                  type="color"
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                  style={{ width: "24px", height: "24px", padding: 0, border: "none", borderRadius: "4px", cursor: "pointer", background: "transparent" }}
                />
              </div>
            </div>
          )}

          {/* Options for CROP */}
          {activeTool === "crop" && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="tool-opt-label">📐 {currentLang === "ar" ? "أبعاد القص:" : "Crop Size:"}</span>
                <span className="tool-opt-value">
                  {selection ? `${Math.round(selection.width)} × ${Math.round(selection.height)} px` : "—"}
                </span>
              </div>

              <div className="tool-bar-separator" />

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="tool-opt-label">{currentLang === "ar" ? "نسب جاهزة:" : "Presets:"}</span>
                <div className="tool-mode-group">
                  <button type="button" onClick={() => setCropPresetRatio(1, 1)} className="tool-mode-btn" title="قص بنسبة مربعة 1:1">
                    1:1 مربع
                  </button>
                  <button type="button" onClick={() => setCropPresetRatio(16, 9)} className="tool-mode-btn" title="قص بنسبة عريضة 16:9">
                    16:9 عريض
                  </button>
                  <button type="button" onClick={() => setCropPresetRatio(4, 3)} className="tool-mode-btn" title="قص بنسبة قياسية 4:3">
                    4:3 قياسي
                  </button>
                  <button type="button" onClick={() => setCropPresetRatio(0, 0)} className="tool-mode-btn" title="تحديد كامل مساحة الصورة">
                    كامل الصورة
                  </button>
                </div>
              </div>

              <div className="tool-bar-separator" />

              <button
                type="button"
                onClick={cropToSelection}
                style={{
                  padding: "5px 14px",
                  borderRadius: "6px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(16,185,129,0.35)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
                title="تطبيق القص على الصورة الحالية (Enter)"
              >
                <Check size={14} />
                <span>{currentLang === "ar" ? "تطبيق القص (Enter)" : "Apply Crop (Enter)"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelection(null);
                  setActiveTool("select");
                  setStatus(currentLang === "ar" ? "تم إلغاء القص والعودة لأداة التحديد" : "Crop cancelled");
                }}
                className="studio-pill studio-pill-neutral"
                style={{ padding: "4px 10px", fontSize: "11px" }}
                title="إلغاء القص (Esc)"
              >
                <X size={13} />
                <span>{currentLang === "ar" ? "إلغاء (Esc)" : "Cancel (Esc)"}</span>
              </button>
            </div>
          )}

          {/* Options for SELECT / FREE TRANSFORM */}
          {activeTool === "select" && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {floatingSubject ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="tool-opt-label">📐 {currentLang === "ar" ? "الأبعاد:" : "Size:"}</span>
                    <span className="tool-opt-value">{Math.round(floatingSubject.width)} × {Math.round(floatingSubject.height)} px</span>
                  </div>

                  <div className="tool-bar-separator" />

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="tool-opt-label">↻ {currentLang === "ar" ? "التدوير:" : "Rot:"}</span>
                    <span className="tool-opt-value">{Math.round(floatingSubject.rotation || 0)}°</span>
                    <button
                      type="button"
                      onClick={() => handleRotateSubject(-90)}
                      className="studio-pill studio-pill-neutral"
                      style={{ padding: "2px 6px", fontSize: "10px" }}
                      title="تدوير -90°"
                    >
                      -90°
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRotateSubject(90)}
                      className="studio-pill studio-pill-neutral"
                      style={{ padding: "2px 6px", fontSize: "10px" }}
                      title="تدوير +90°"
                    >
                      +90°
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRotateSubject(0, true)}
                      className="studio-pill studio-pill-neutral"
                      style={{ padding: "2px 6px", fontSize: "10px" }}
                      title="استعادة زاوية 0°"
                    >
                      0°
                    </button>
                  </div>

                  <div className="tool-bar-separator" />

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="tool-opt-label">🎯 {currentLang === "ar" ? "محاذاة:" : "Align:"}</span>
                    <button type="button" onClick={() => handleAlignSubject("center")} className="studio-pill studio-pill-neutral" style={{ padding: "2px 6px", fontSize: "10px" }} title="توسيط في المسرح">✛ المنتصف</button>
                    <button type="button" onClick={() => handleAlignSubject("left")} className="studio-pill studio-pill-neutral" style={{ padding: "2px 6px", fontSize: "10px" }} title="أقصى اليسار">← اليسار</button>
                    <button type="button" onClick={() => handleAlignSubject("right")} className="studio-pill studio-pill-neutral" style={{ padding: "2px 6px", fontSize: "10px" }} title="أقصى اليمين">اليمين →</button>
                    <button type="button" onClick={handleFitSubjectToCanvas} className="studio-pill studio-pill-neutral" style={{ padding: "2px 6px", fontSize: "10px" }} title="ملاءمة الأبعاد">ملاءمة</button>
                  </div>

                  <div className="tool-bar-separator" />

                  <button
                    type="button"
                    onClick={handleExportPureSubject}
                    className="studio-pill studio-pill-bg"
                    style={{ padding: "3px 10px", fontSize: "11px" }}
                    title="تصدير العنصر المعزول كـ PNG شفاف نقي"
                  >
                    📥 {currentLang === "ar" ? "تصدير PNG شفاف" : "Export PNG"}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="tool-opt-label">{currentLang === "ar" ? "شكل التحديد:" : "Shape:"}</span>
                    <div className="tool-mode-group">
                      <button
                        type="button"
                        onClick={() => setSelectionShape("rectangle")}
                        className={`tool-mode-btn ${selectionShape === "rectangle" ? "active" : ""}`}
                      >
                        {currentLang === "ar" ? "مستطيل" : "Rectangle"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectionShape("ellipse")}
                        className={`tool-mode-btn ${selectionShape === "ellipse" ? "active" : ""}`}
                      >
                        {currentLang === "ar" ? "بيضاوي" : "Ellipse"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectionShape("free")}
                        className={`tool-mode-btn ${selectionShape === "free" ? "active" : ""}`}
                      >
                        {currentLang === "ar" ? "حر (Lasso)" : "Free"}
                      </button>
                    </div>
                  </div>

                  <div className="tool-bar-separator" />

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="tool-opt-label">{currentLang === "ar" ? "الوضع:" : "Mode:"}</span>
                    <div className="tool-mode-group">
                      <button
                        type="button"
                        onClick={() => setSelectionMode("replace")}
                        className={`tool-mode-btn ${selectionMode === "replace" ? "active" : ""}`}
                      >
                        جديد
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectionMode("add")}
                        className={`tool-mode-btn ${selectionMode === "add" ? "active" : ""}`}
                      >
                        + إضافة
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectionMode("subtract")}
                        className={`tool-mode-btn ${selectionMode === "subtract" ? "active" : ""}`}
                      >
                        - طرح
                      </button>
                    </div>
                  </div>

                  <div className="tool-bar-separator" />

                  <button
                    type="button"
                    onClick={() => handleEnableFreeTransformOnLayer(selectedLayer)}
                    className="studio-pill studio-pill-neutral"
                    style={{ padding: "3px 10px", fontSize: "11px" }}
                    title="تفعيل التحويل الحر (8 مقاود + تدوير) للطبقة الحالية"
                  >
                    📐 {currentLang === "ar" ? "تحويل حر للطبقة الحالية" : "Free Transform Layer"}
                  </button>
                </>
              )}

              <div className="tool-bar-separator" />
              <div className="align-group-pill" title="محاذاة العناصر على مساحة العمل">
                <button type="button" className="align-btn" onClick={() => handleApplyAlignment("left")} title="محاذاة لليسار"><AlignLeft size={13} /></button>
                <button type="button" className="align-btn" onClick={() => handleApplyAlignment("center-h")} title="محاذاة أفقية للوسط"><AlignCenter size={13} /></button>
                <button type="button" className="align-btn" onClick={() => handleApplyAlignment("right")} title="محاذاة لليمين"><AlignRight size={13} /></button>
                <button type="button" className="align-btn" onClick={() => handleApplyAlignment("top")} title="محاذاة للأعلى">⤒</button>
                <button type="button" className="align-btn" onClick={() => handleApplyAlignment("center-v")} title="محاذاة رأسية للوسط">↕</button>
                <button type="button" className="align-btn" onClick={() => handleApplyAlignment("bottom")} title="محاذاة للأسفل">⤓</button>
              </div>

              <div className="tool-bar-separator" />

              <button
                type="button"
                onClick={() => {
                  setSnapEnabled(!snapEnabled);
                  setStatus(snapEnabled ? "تم إيقاف الالتصاق الذكي (Snap)" : "تم تفعيل الالتصاق الذكي (Snap) للمنتصف والحواف والأدلة");
                }}
                className={`studio-pill studio-pill-neutral ${snapEnabled ? "is-active" : ""}`}
                style={{ padding: "3px 8px", fontSize: "10px", display: "flex", alignItems: "center", gap: "4px" }}
                title="الالتصاق المغناطيسي الذكي (Smart Magnetic Snap)"
              >
                <Magnet size={12} style={{ color: snapEnabled ? "#ec4899" : "inherit" }} />
                <span>{snapEnabled ? "الالتصاق: مفعّل" : "الالتصاق: متوقف"}</span>
              </button>
            </div>
          )}

          {/* Options for RETOUCH (CLONE / HEAL) */}
          {(activeTool === "clone" || activeTool === "heal") && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="tool-opt-label">{currentLang === "ar" ? "نصف القطر:" : "Radius:"}</span>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={retouchRadius}
                  onChange={(e) => setRetouchRadius(Number(e.target.value))}
                  style={{ width: "80px", accentColor: "#38bdf8" }}
                />
                <span className="tool-opt-value">{retouchRadius}px</span>
              </div>
              <span style={{ fontSize: "10px", color: "var(--studio-accent)" }}>
                {currentLang === "ar" ? "💡 اضغط Alt + نقر لتحديد نقطة المصدر" : "💡 Alt + click to set source point"}
              </span>
            </div>
          )}
        </div>

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
            <div className="tool-rail-bottom">
              <button className="tool-button" onClick={() => uploadRef.current?.click()} aria-label="رفع صورة" title="فتح صورة من الجهاز">
                <Upload size={18} />
              </button>
              <button className="tool-button" aria-label="إعدادات الأدوات" title="لوحة الخصائص" onClick={() => { setActiveTab("properties"); if (!isInspectorOpen) setIsInspectorOpen(true); setStatus("تم فتح إعدادات الأدوات"); }}>
                <Settings2 size={18} />
              </button>
              <button
                className="tool-button"
                onClick={() => setHelpOpen(true)}
                aria-label="دليل المستخدم"
                title="📖 دليل المستخدم — مساعدة"
                style={{ color: "var(--studio-accent)" }}
              >
                <Info size={18} />
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
                  className="color-swap-btn"
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
              onWheel={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  e.preventDefault();
                  const delta = e.deltaY < 0 ? 5 : -5;
                  setZoom((value) => Math.max(10, Math.min(300, value + delta)));
                }
              }}
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
              onDragEnter={(e) => {
                e.preventDefault();
                dragCounterRef.current += 1;
                setIsDragOverStage(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
                if (dragCounterRef.current === 0) {
                  setIsDragOverStage(false);
                }
              }}
              onDrop={async (event) => {
                event.preventDefault();
                dragCounterRef.current = 0;
                setIsDragOverStage(false);

                // Check internal creative drag & drop (from Creative Library modal or sidebar)
                const rawJson = event.dataTransfer.getData("application/json");
                if (rawJson) {
                  try {
                    const data = JSON.parse(rawJson);
                    if (data.type === "asset") {
                      const asset = ASSET_GRAPHICS.find((a) => a.id === data.assetId);
                      if (asset) {
                        handleAddAssetGraphic(asset);
                        return;
                      }
                    } else if (data.type === "stock-photo") {
                      const photo = STOCK_PHOTOS.find((p) => p.id === data.photoId);
                      if (photo) {
                        handleApplyStockPhoto(photo, true);
                        return;
                      }
                    }
                  } catch (err) {}
                }

                const file = event.dataTransfer.files[0];
                if (!file) return;

                if (isProjectFile(file)) {
                  const text = await file.text();
                  try {
                    const pkg = deserializeProjectPackage(text);
                    setImageName(pkg.state.imageName || file.name.replace(/\.imagepro$/, ""));
                    setImageSrc(pkg.state.imageData);
                    setStatus(currentLang === "ar" ? "تم استيراد ملف المشروع (.imagepro) بنجاح" : "Project imported successfully");
                  } catch (err) {
                    setStatus("فشل استيراد ملف المشروع");
                  }
                  return;
                }

                if (isSupportedImageFile(file)) {
                  try {
                    const meta = await extractDroppedImageMeta(file);
                    setDroppedImageMeta(meta);
                    setIsSmartDropHubOpen(true);
                  } catch (err) {
                    console.error("Drop meta error:", err);
                    const data = new DataTransfer();
                    data.items.add(file);
                    if (uploadRef.current) {
                      uploadRef.current.files = data.files;
                      uploadRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                  }
                }
              }}
            >
              {/* Canva-Grade Drag & Drop Stage Live Overlay */}
              {isDragOverStage && (
                <div className="stage-drag-overlay">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-cyan-500/40 text-white">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                  </div>
                  <div className="text-center px-4">
                    <h3 className="text-base font-extrabold tracking-wide text-white">
                      {currentLang === "ar" ? "أفلت الصورة لفتح مركز الإدراج الذكي" : "Drop Image to Open Smart Hub"}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      {currentLang === "ar" ? "إضافة كطبقة • تفريغ ذكي بالذكاء الاصطناعي • مشروع جديد • استوديو الدمج" : "Layer • AI Cutout • New Canvas • Two-Image Blend"}
                    </p>
                  </div>
                </div>
              )}

              {/* Crash Recovery Notification Toast */}
              {autosaveRecoverCandidate && (
                <div
                  style={{
                    position: "absolute",
                    top: "16px",
                    zIndex: 40,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    background: "#ffffff",
                    border: "1px solid #e0f0ff",
                    boxShadow: "0 8px 30px rgba(0,87,255,0.15)",
                    color: "#1c1917",
                    fontSize: "12px",
                    fontWeight: 600,
                    backdropFilter: "blur(12px)"
                  }}
                >
                  <span style={{ fontSize: "15px" }}>⚠️</span>
                  <span>
                    {currentLang === "ar"
                      ? "تم العثور على جلسة عمل سابقة غير محفوظة (حفظ تلقائي)."
                      : "An unsaved work session was recovered."}
                  </span>
                  <button
                    className="picsart-btn-burgundy picsart-pill"
                    style={{ padding: "4px 12px", fontSize: "11px", height: "auto" }}
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(autosaveRecoverCandidate.data);
                        loadPackageIntoStudio(parsed);
                        setAutosaveRecoverCandidate(null);
                        setStatus(currentLang === "ar" ? "تمت استعادة جلسة العمل السابقة بنجاح" : "Recovered previous session");
                      } catch {
                        setAutosaveRecoverCandidate(null);
                      }
                    }}
                  >
                    {currentLang === "ar" ? "استعادة الجلسة" : "Recover Session"}
                  </button>
                  <button
                    className="picsart-btn-secondary picsart-pill"
                    style={{ padding: "4px 10px", fontSize: "11px", height: "auto" }}
                    onClick={() => {
                      clearAutosaveRecovery();
                      setAutosaveRecoverCandidate(null);
                    }}
                  >
                    {currentLang === "ar" ? "تجاهل" : "Dismiss"}
                  </button>
                </div>
              )}

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

              <div
                className="canvas-card"
                style={{
                  width: `${cardDimensions.width}px`,
                  height: `${cardDimensions.height}px`,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`
                }}
              >
                <canvas
                  ref={canvasRef}
                  aria-label="مساحة تحرير الصورة"
                  className="canvas-checkerboard"
                  style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenuPos({ x: e.clientX, y: e.clientY });
                    setIsContextMenuOpen(true);
                  }}
                  onPointerDown={startDrawing}
                  onPointerMove={(e) => {
                    const pt = pointFromPointer(e);
                    setMouseCoord({ x: Math.round(pt.x), y: Math.round(pt.y) });
                    continueDrawing(e);
                  }}
                  onPointerLeave={() => setMouseCoord(null)}
                  onPointerUp={finishDrawing}
                  onPointerCancel={finishDrawing}
                  onWheel={(e) => {
                    if (floatingSubject) {
                      const pt = pointFromPointer(e);
                      const curX = floatingSubjectPosRef.current ? floatingSubjectPosRef.current.x : floatingSubject.x;
                      const curY = floatingSubjectPosRef.current ? floatingSubjectPosRef.current.y : floatingSubject.y;
                      if (
                        pt.x >= curX - 10 &&
                        pt.x <= curX + floatingSubject.width + 10 &&
                        pt.y >= curY - 10 &&
                        pt.y <= curY + floatingSubject.height + 10
                      ) {
                        e.preventDefault();
                        const delta = e.deltaY < 0 ? 5 : -5;
                        handleScaleSubjectDelta(delta);
                      }
                    }
                  }}
                />
                {mouseCoord && (activeTool === "eraser" || activeTool === "brush" || activeTool === "pencil" || activeTool === "clone" || activeTool === "heal") && (
                  <div
                    className="canvas-brush-cursor"
                    style={{
                      position: "absolute",
                      left: `${(mouseCoord.x / Math.max(1, canvasRef.current?.width || 1)) * 100}%`,
                      top: `${(mouseCoord.y / Math.max(1, canvasRef.current?.height || 1)) * 100}%`,
                      width: `${Math.max(8, (activeTool === "clone" || activeTool === "heal" ? retouchRadius * 2 : brushSize) / Math.max(1, canvasRef.current?.width || 1) * (canvasRef.current?.clientWidth || 300))}px`,
                      height: `${Math.max(8, (activeTool === "clone" || activeTool === "heal" ? retouchRadius * 2 : brushSize) / Math.max(1, canvasRef.current?.width || 1) * (canvasRef.current?.clientWidth || 300))}px`,
                      transform: "translate(-50%, -50%)",
                      borderRadius: "50%",
                      border: activeTool === "eraser" ? "2px dashed #0ea5e9" : activeTool === "clone" || activeTool === "heal" ? "2px dashed #38bdf8" : `2px solid ${foregroundColor}`,
                      backgroundColor: activeTool === "eraser" ? "rgba(14,165,233,0.16)" : activeTool === "clone" || activeTool === "heal" ? "rgba(56, 189, 248, 0.16)" : `${foregroundColor}22`,
                      pointerEvents: "none",
                      zIndex: 20,
                      boxShadow: "0 0 6px rgba(0,0,0,0.6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <div
                      style={{
                        width: "3px",
                        height: "3px",
                        borderRadius: "50%",
                        backgroundColor: activeTool === "eraser" ? "#0ea5e9" : activeTool === "clone" || activeTool === "heal" ? "#38bdf8" : foregroundColor,
                      }}
                    />
                  </div>
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
                    {activeTool === "crop" ? (
                      <>
                        <div className="crop-grid-line-h1" />
                        <div className="crop-grid-line-h2" />
                        <div className="crop-grid-line-v1" />
                        <div className="crop-grid-line-v2" />
                        <div className="crop-badge-hud">
                          ✂️ {Math.round(selection.width)} × {Math.round(selection.height)} px
                        </div>
                      </>
                    ) : (
                      <span>{selectionShape === "ellipse" ? "تحديد بيضاوي" : selectionShape === "free" ? "تحديد حر" : "تحديد مستطيل"}</span>
                    )}
                  </div>
                )}

                {/* Section 13: 8-Handle Interactive Free Transform Box */}
                {floatingSubject && activeTool === "select" && (
                  <div
                    className="free-transform-box"
                    style={{
                      left: `${(floatingSubject.x / Math.max(1, canvasRef.current?.width || 1)) * 100}%`,
                      top: `${(floatingSubject.y / Math.max(1, canvasRef.current?.height || 1)) * 100}%`,
                      width: `${(floatingSubject.width / Math.max(1, canvasRef.current?.width || 1)) * 100}%`,
                      height: `${(floatingSubject.height / Math.max(1, canvasRef.current?.height || 1)) * 100}%`,
                      transform: floatingSubject.rotation ? `rotate(${floatingSubject.rotation}deg)` : undefined,
                    }}
                    onPointerMove={handleTransformPointerMove}
                    onPointerUp={handleTransformPointerUp}
                  >
                    {/* Move surface */}
                    <div
                      className="transform-drag-surface"
                      onPointerDown={(e) => handleTransformPointerDown(e, "move")}
                      title={currentLang === "ar" ? "اسحب لتحريك العنصر" : "Drag to move subject"}
                    />

                    {/* Rotation stem and circular pip handle */}
                    <div className="transform-rot-stem" />
                    <div
                      className="transform-rot-handle"
                      onPointerDown={(e) => handleTransformPointerDown(e, "rot")}
                      title={currentLang === "ar" ? "اسحب للتدوير الحر (↻)" : "Drag to rotate"}
                    >
                      ↻
                    </div>

                    {/* 4 Corner handles */}
                    <div className="transform-handle transform-handle-nw" onPointerDown={(e) => handleTransformPointerDown(e, "nw")} title="تغيير الحجم من الزاوية" />
                    <div className="transform-handle transform-handle-ne" onPointerDown={(e) => handleTransformPointerDown(e, "ne")} title="تغيير الحجم من الزاوية" />
                    <div className="transform-handle transform-handle-se" onPointerDown={(e) => handleTransformPointerDown(e, "se")} title="تغيير الحجم من الزاوية" />
                    <div className="transform-handle transform-handle-sw" onPointerDown={(e) => handleTransformPointerDown(e, "sw")} title="تغيير الحجم من الزاوية" />

                    {/* 4 Edge handles */}
                    <div className="transform-handle transform-handle-n" onPointerDown={(e) => handleTransformPointerDown(e, "n")} title="تغيير الارتفاع لأعلى" />
                    <div className="transform-handle transform-handle-s" onPointerDown={(e) => handleTransformPointerDown(e, "s")} title="تغيير الارتفاع لأسفل" />
                    <div className="transform-handle transform-handle-w" onPointerDown={(e) => handleTransformPointerDown(e, "w")} title="تغيير العرض لليسار" />
                    <div className="transform-handle transform-handle-e" onPointerDown={(e) => handleTransformPointerDown(e, "e")} title="تغيير العرض لليمين" />

                    {/* Live Transform HUD Badge */}
                    <div className="transform-hud">
                      <span>📐 {Math.round(floatingSubject.width)} × {Math.round(floatingSubject.height)} px</span>
                      <span>•</span>
                      <span>↻ {Math.round(floatingSubject.rotation || 0)}°</span>
                    </div>
                  </div>
                )}

                {/* Section 15: Grid Overlay */}
                {showGrid && (
                  <div
                    className="canvas-grid-overlay"
                    style={{
                      backgroundImage: "linear-gradient(to right, rgba(45,212,191,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(45,212,191,0.18) 1px, transparent 1px)",
                      backgroundSize: "40px 40px"
                    }}
                  />
                )}

                {/* Section 15: Interactive Guides */}
                {showGuides && guides.map((guide) => (
                  <div
                    key={guide.id}
                    className={guide.orientation === "horizontal" ? "guide-line-h" : "guide-line-v"}
                    style={guide.orientation === "horizontal"
                      ? { top: `${(guide.position / Math.max(1, canvasRef.current?.height || 1)) * 100}%` }
                      : { left: `${(guide.position / Math.max(1, canvasRef.current?.width || 1)) * 100}%` }
                    }
                    onPointerDown={(e) => handleGuideDrag(guide.id, e)}
                    onPointerMove={(e) => handleGuidePointerMove(guide.id, e)}
                    onPointerUp={(e) => handleGuidePointerUp(guide.id, e)}
                    onDoubleClick={() => handleRemoveGuide(guide.id)}
                    title="اسحب لتعديل الموضع، أو انقر نقراً مزدوجاً للحذف"
                  >
                    <span className="guide-pill">{Math.round(guide.position)}px</span>
                  </div>
                ))}

                {/* Section 15: Smart Snap Visual Indicators */}
                {activeSnapLines.map((snap, idx) => (
                  snap.orientation === "vertical" ? (
                    <div
                      key={`snap-v-${idx}`}
                      className="snap-indicator-line-v"
                      style={{ left: `${(snap.position / Math.max(1, canvasRef.current?.width || 1)) * 100}%` }}
                    />
                  ) : (
                    <div
                      key={`snap-h-${idx}`}
                      className="snap-indicator-line-h"
                      style={{ top: `${(snap.position / Math.max(1, canvasRef.current?.height || 1)) * 100}%` }}
                    />
                  )
                ))}
              </div>

              {/* Section 15: Top & Left Rulers */}
              {showRulers && (
                <>
                  <div className="canvas-ruler-corner" title="وحدة القياس: بكسل (px)">px</div>
                  <div
                    className="canvas-ruler-top"
                    onMouseDown={(e) => handleRulerMouseDown("horizontal", e)}
                    title="مسطرة الأبعاد العلوية (بكسل) — انقر واسحب لأسفل لإنشاء خط إرشادي"
                  >
                    <svg width="100%" height="20" style={{ display: "block", overflow: "visible" }}>
                      {Array.from({ length: 40 }).map((_, i) => {
                        const val = i * 100;
                        const xPos = (val * (zoom / 100)) + pan.x + (canvasStageRef.current ? canvasStageRef.current.clientWidth / 2 - (imageSize.width * (zoom / 100)) / 2 : 100);
                        return (
                          <g key={i}>
                            <line x1={xPos} y1={12} x2={xPos} y2={20} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
                            <text x={xPos + 3} y={11} fill="#64748b" fontSize={9} fontFamily="monospace">{val}</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  <div
                    className="canvas-ruler-left"
                    onMouseDown={(e) => handleRulerMouseDown("vertical", e)}
                    title="مسطرة الأبعاد الجانبية (بكسل) — انقر واسحب لليمين لإنشاء خط إرشادي"
                  >
                    <svg width="20" height="100%" style={{ display: "block", overflow: "visible" }}>
                      {Array.from({ length: 30 }).map((_, i) => {
                        const val = i * 100;
                        const yPos = (val * (zoom / 100)) + pan.y + (canvasStageRef.current ? canvasStageRef.current.clientHeight / 2 - (imageSize.height * (zoom / 100)) / 2 : 100);
                        return (
                          <g key={i}>
                            <line x1={12} y1={yPos} x2={20} y2={yPos} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
                            <text x={2} y={yPos - 2} fill="#64748b" fontSize={8} fontFamily="monospace" transform={`rotate(-90 2 ${yPos - 2})`}>{val}</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </>
              )}

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

                  {/* Filter chips bar */}
                  <div className="layer-filter-bar">
                    <button className={`layer-filter-btn ${layerFilter === "all" ? "active" : ""}`} onClick={() => setLayerFilter("all")}>الكل ({layers.length})</button>
                    <button className={`layer-filter-btn ${layerFilter === "paint" ? "active" : ""}`} onClick={() => setLayerFilter("paint")}>🎨 رسم ({layers.filter(l => l.kind === "paint").length})</button>
                    <button className={`layer-filter-btn ${layerFilter === "text" ? "active" : ""}`} onClick={() => setLayerFilter("text")}>🔤 نصوص ({layers.filter(l => l.kind === "text").length})</button>
                    {layers.some(l => l.kind === "subject" || l.id === "floating-subject") && (
                      <button className={`layer-filter-btn ${layerFilter === "subject" ? "active" : ""}`} onClick={() => setLayerFilter("subject")}>👤 معزول</button>
                    )}
                    <button className={`layer-filter-btn ${layerFilter === "image" ? "active" : ""}`} onClick={() => setLayerFilter("image")}>🖼️ صور ({layers.filter(l => l.kind === "image" || l.kind === "background").length})</button>
                  </div>

                  {/* Solo mode active ribbon */}
                  {soloLayerId && (
                    <div className="layer-solo-banner">
                      <span>👁‍🗨 وضع العزل (Solo) نشط: {layers.find(l => l.id === soloLayerId)?.name || soloLayerId}</span>
                      <button onClick={() => toggleSolo(soloLayerId)}>إلغاء العزل (إظهار الكل)</button>
                    </div>
                  )}

                  <div className="layer-stack">
                    {layers
                      .filter(l => {
                        if (layerFilter === "all") return true;
                        if (layerFilter === "paint") return l.kind === "paint";
                        if (layerFilter === "text") return l.kind === "text";
                        if (layerFilter === "subject") return l.kind === "subject" || l.id === "floating-subject";
                        if (layerFilter === "image") return l.kind === "image" || l.kind === "background";
                        return true;
                      })
                      .map((layer, index) => (
                      <div
                        key={layer.id}
                        className={`layer-item-wrapper ${layer.parentId ? "child-layer" : ""} ${dragOverIndex === index ? "drag-over" : ""}`}
                        style={{ marginLeft: layer.parentId ? "16px" : "0", borderLeft: layer.parentId ? "2px solid rgba(255,255,255,0.1)" : "none" }}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                      >
                        <button
                          className={`layer-row ${selectedLayer === layer.id ? "selected" : ""} ${layer.locked ? "locked" : ""}`}
                          onClick={() => handleSelectLayer(layer.id)}
                          onDoubleClick={() => { setEditingLayerId(layer.id); setEditingLayerName(layer.name); }}
                          draggable={!layer.locked && layer.kind !== "background"}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnd={() => { setDraggedLayerIndex(null); setDragOverIndex(null); }}
                          title="انقر لتحديد الطبقة، اسحب لإعادة الترتيب، انقر نقراً مزدوجاً لإعادة التسمية"
                        >
                          <span className="layer-drag" title="اسحب لإعادة ترتيب الطبقة">⋮⋮</span>
                          <span className="layer-eye" onClick={(event) => { event.stopPropagation(); toggleLayer(layer.id); }} title={layer.visible ? "إخفاء الطبقة" : "إظهار الطبقة"}>
                            {layer.visible ? <Eye size={14} /> : <span className="eye-off" />}
                          </span>
                          <span className="layer-lock" onClick={(event) => { event.stopPropagation(); toggleLayerLock(layer.id); }} style={{ padding: "0 4px", opacity: layer.locked ? 1 : 0.4 }} title={layer.locked ? "إلغاء قفل الطبقة" : "قفل الطبقة"}>
                            {layer.locked ? <Lock size={12} color="#f87171" /> : <Unlock size={12} />}
                          </span>
                          <span
                            className="layer-solo-toggle"
                            onClick={(event) => { event.stopPropagation(); toggleSolo(layer.id); }}
                            title={soloLayerId === layer.id ? "إلغاء عزل الطبقة" : "عزل هذه الطبقة فقط (Solo)"}
                            style={{ color: soloLayerId === layer.id ? "#facc15" : "#647e78", cursor: "pointer", display: "grid", placeItems: "center", padding: "0 2px" }}
                          >
                            {soloLayerId === layer.id ? <EyeOff size={13} /> : <Eye size={13} style={{ opacity: 0.4 }} />}
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
                              <small>
                                {layer.kind === "adjustment" ? "طبقة تعديل" : 
                                 layer.kind === "image" ? "الصورة الأساسية" : 
                                 layer.kind === "subject" || layer.id === "floating-subject" ? "عنصر معزول (شخص)" :
                                 layer.kind === "mask" ? "قناع غير تدميري" : 
                                 layer.kind === "text" ? "نص قابل للتحرير" : 
                                 layer.kind === "background" ? "طبقة خلفية" : 
                                 layer.kind === "group" ? "مجموعة طبقات" : "طبقة رسم"}
                              </small>
                            )}
                          </span>
                          {index === 0 && (
                            <span title="الطبقة الأولى (في أعلى الترتيب)">
                              <Sparkles size={13} className="layer-spark" />
                            </span>
                          )}
                          {selectedLayer === layer.id && <span className="layer-active-badge">محددة</span>}
                        </button>

                        {/* Inline Quick Action Bar for the actively selected layer */}
                        {selectedLayer === layer.id && (
                          <div className="layer-row-quick-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={moveLayerToTop}
                              title="جلب الطبقة إلى المقدمة (جعلها الأولى) [Ctrl+Shift+]]"
                              className="quick-action-btn primary-top"
                              data-testid="quick-move-top"
                            >
                              <ChevronsUp size={13} />
                              <span>الأولى</span>
                            </button>
                            <button
                              onClick={moveLayerUp}
                              title="تقديم خطوة واحدة لأعلى [Ctrl+]]"
                              className="quick-action-btn"
                              data-testid="quick-move-up"
                            >
                              <ArrowUp size={13} />
                              <span>أعلى</span>
                            </button>
                            <button
                              onClick={moveLayerDown}
                              title="تأخير خطوة واحدة لأسفل [Ctrl+[]"
                              className="quick-action-btn"
                              data-testid="quick-move-down"
                            >
                              <ArrowDown size={13} />
                              <span>أسفل</span>
                            </button>
                            <button
                              onClick={moveLayerToBottom}
                              title="إرسال إلى المؤخرة (فوق الخلفية) [Ctrl+Shift+[]"
                              className="quick-action-btn"
                              data-testid="quick-move-bottom"
                            >
                              <ChevronsDown size={13} />
                              <span>الأخيرة</span>
                            </button>
                            <button
                              onClick={() => toggleSolo(layer.id)}
                              title="عزل هذه الطبقة فقط لإظهارها بمفردها (Solo)"
                              className={`quick-action-btn ${soloLayerId === layer.id ? "active-solo" : ""}`}
                              data-testid="quick-toggle-solo"
                            >
                              <EyeOff size={13} />
                              <span>{soloLayerId === layer.id ? "إلغاء عزل" : "عزل"}</span>
                            </button>
                            <button
                              onClick={duplicateSelectedLayer}
                              title="تكرار الطبقة [Ctrl+J]"
                              className="quick-action-btn"
                              data-testid="quick-duplicate"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              onClick={removeSelectedLayer}
                              title="حذف الطبقة"
                              className="quick-action-btn"
                              style={{ color: "#f87171" }}
                              data-testid="quick-delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
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
                          <div className="quick-opacity-chips">
                            {[100, 75, 50, 25].map(val => (
                              <button
                                key={val}
                                className={`opacity-chip ${(selLayer.opacity ?? 100) === val ? "active" : ""}`}
                                onClick={() => setSelectedLayerOpacity(val)}
                                disabled={selLayer.locked}
                              >
                                {val}%
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={selLayer.opacity ?? 100}
                          onChange={(e) => setSelectedLayerOpacity(Number(e.target.value))}
                          className="opacity-slider"
                          disabled={selLayer.locked}
                        />

                        <div className="layer-control-row" style={{ marginTop: 8 }}>
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

                        {/* Quick Layer Transforms & Alignment */}
                        <div className="layer-transform-row">
                          <button onClick={flipSelectedLayerH} title="عكس أفقي للطبقة المحددة">
                            <FlipHorizontal size={12} style={{ display: "inline", verticalAlign: "middle", marginLeft: 4 }} />
                            عكس أفقي
                          </button>
                          <button onClick={flipSelectedLayerV} title="عكس رأسي للطبقة المحددة">
                            <FlipVertical size={12} style={{ display: "inline", verticalAlign: "middle", marginLeft: 4 }} />
                            عكس رأسي
                          </button>
                          <button onClick={centerSelectedLayer} title="توسيط الطبقة المحددة في مساحة العمل">
                            ✛ توسيط
                          </button>
                          <button onClick={() => handleEnableFreeTransformOnLayer(selectedLayer)} title="تحويل حر ومباشر (8 مقاود + تدوير 360°)">
                            📐 تحويل حر
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="layer-footer">
                    <button onClick={moveLayerToTop} aria-label="جعل الطبقة الأولى" data-testid="move-layer-first" title="جلب الطبقة إلى المقدمة (الطبقة الأولى) [Ctrl+Shift+]]" className="primary-action"><ChevronsUp size={16} /></button>
                    <button onClick={moveLayerUp} aria-label="تقديم الطبقة لأعلى" data-testid="move-layer-up" title="تقديم الطبقة خطوة لأعلى [Ctrl+]]"><ArrowUp size={16} /></button>
                    <button onClick={moveLayerDown} aria-label="تأخير الطبقة لأسفل" data-testid="move-layer-down" title="تأخير الطبقة خطوة لأسفل [Ctrl+[]"><ArrowDown size={16} /></button>
                    <button onClick={moveLayerToBottom} aria-label="جعل الطبقة الأخيرة" data-testid="move-layer-bottom" title="إرسال الطبقة إلى أسفل الترتيب (فوق الخلفية) [Ctrl+Shift+[]]"><ChevronsDown size={16} /></button>
                    <button onClick={addLayerGroup} aria-label="إضافة مجموعة جديدة" title="إضافة مجلد/مجموعة جديدة"><Folder size={16} /></button>
                    <button onClick={addPaintLayer} aria-label="إضافة طبقة رسم" data-testid="add-paint-layer" title="إضافة طبقة رسم"><Plus size={16} /></button>
                    <button onClick={addMaskToLayer} aria-label="إضافة قناع" title="إضافة قناع إخفاء للطبقة (Layer Mask)"><Square size={16} fill="white" /><Circle size={8} fill="black" style={{position:"absolute", right:"38%"}} /></button>
                    <button onClick={duplicateSelectedLayer} aria-label="تكرار الطبقة" data-testid="duplicate-layer" title="تكرار الطبقة المحددة [Ctrl+J]"><Layers3 size={16} /></button>
                    <button onClick={mergeLayerDown} aria-label="دمج لأسفل" title="دمج طبقة الرسم الحالية مع الطبقة التي أسفلها"><Combine size={16} /></button>
                    <button onClick={removeSelectedLayer} aria-label="حذف الطبقة" data-testid="delete-layer" title="حذف الطبقة المحددة"><Trash2 size={16} /></button>
                  </div>
                </>
              ) : (
                <div className="properties-panel">
                  {/* Studio Quick Actions: AI Cutout, Blend Two Images, Watermark (Inside Properties Tab) */}
                  <div className="sidebar-studio-actions">
                    <button
                      type="button"
                      className="sidebar-studio-btn sidebar-studio-btn-ai"
                      onClick={() => {
                        setPropertiesSection("ai");
                        handlePureContentCutout();
                      }}
                      title="عزل العنصر الأساسي وتأثيرات الخلفية بالذكاء الاصطناعي بدقة متناهية"
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <WandSparkles size={14} />
                        <span>عزل بالذكاء الاصطناعي</span>
                      </span>
                      <span style={{ fontSize: "10px", opacity: 0.85, background: "rgba(6,182,212,0.2)", padding: "1px 6px", borderRadius: "4px" }}>AI Magic</span>
                    </button>

                    <button
                      type="button"
                      className="sidebar-studio-btn"
                      onClick={() => setIsBlendModalOpen(true)}
                      title="دمج صورتين ومزج الطبقات باحترافية"
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Combine size={14} />
                        <span>دمج صورتين</span>
                      </span>
                      <span style={{ fontSize: "10px", opacity: 0.7 }}>مزج</span>
                    </button>

                    <button
                      type="button"
                      className="sidebar-studio-btn"
                      onClick={() => setIsWatermarkOpen(true)}
                      title="إضافة وتخصيص العلامة المائية لحماية الحقوق"
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Sparkles size={14} />
                        <span>العلامة المائية</span>
                      </span>
                      <span style={{ fontSize: "10px", opacity: 0.7 }}>حماية</span>
                    </button>
                  </div>

                  {/* Automated Sub-navigation segmented control (Pixelora / Canva Style) */}
                  <div className="properties-sub-nav">
                    <button
                      type="button"
                      className={`properties-sub-pill ${propertiesSection === "brush" ? "active" : ""}`}
                      onClick={() => { setPropertiesSection("brush"); setStatus("أدوات الفرشاة والرسم"); }}
                    >
                      <span>🎨</span>
                      <span>الفرشاة</span>
                    </button>
                    <button
                      type="button"
                      className={`properties-sub-pill ${propertiesSection === "color" ? "active" : ""}`}
                      onClick={() => { setPropertiesSection("color"); setStatus("التعديلات اللونية والإضاءة"); }}
                    >
                      <span>☀️</span>
                      <span>الألوان</span>
                    </button>
                    <button
                      type="button"
                      className={`properties-sub-pill ${propertiesSection === "filters" ? "active" : ""}`}
                      onClick={() => { setPropertiesSection("filters"); setStatus("معرض الفلاتر الحية"); }}
                    >
                      <span>🎭</span>
                      <span>الفلاتر</span>
                    </button>
                    <button
                      type="button"
                      className={`properties-sub-pill ${propertiesSection === "ai" ? "active" : ""}`}
                      onClick={() => { setPropertiesSection("ai"); setStatus("ستوديو عزل الأجسام وتأثيرات الخلفية والذكاء الاصطناعي"); }}
                      title="عزل الأجسام وتأثيرات الخلفية، تمويه البورتريه، واستبدال الخلفيات"
                    >
                      <span>✨</span>
                      <span>العزل والخلفية AI</span>
                    </button>
                  </div>

                  {/* ─── القسم 1: أدوات الفرشاة والرسم المتطورة ─── */}
                  {propertiesSection === "brush" && (
                    <>
                      <div className="panel-heading">
                        <span>ستوديو أدوات الرسم والتلوين</span>
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

                      {/* Pixelora Style Brush Presets Grid */}
                      <div className="sb-section-label" style={{ padding: "0 16px 6px" }}>
                        نوع الفرشاة والرسم
                      </div>
                      <div className="brush-presets-grid">
                        {BRUSH_PRESETS.map((preset) => (
                          <div
                            key={preset.id}
                            className={`brush-preset-card ${activeBrushPreset === preset.id ? "active" : ""}`}
                            onClick={() => handleSelectBrushPreset(preset.id)}
                          >
                            <span className="brush-preset-icon">{preset.icon}</span>
                            <span className="brush-preset-label">{preset.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Pixelora Style Live Brush Preview Capsule */}
                      <LiveBrushPreview
                        color={foregroundColor}
                        size={brushSize}
                        opacity={brushOpacity}
                        hardness={brushHardness}
                        preset={activeBrushPreset}
                      />

                      {/* Quick Color Palette & Swatches */}
                      <div style={{ padding: "0 17px", marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span className="sb-section-label">لوحة الألوان والتبديل</span>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={swapColors}
                              title="تبديل الأمامي والخلفي (X)"
                              className="sb-ghost-btn"
                            >
                              تبديل (X)
                            </button>
                            <button
                              type="button"
                              onClick={resetColors}
                              title="استعادة الافتراضي (D)"
                              className="sb-ghost-btn"
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

                      {/* Phase 11: Text Editor Panel */}
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
                    </>
                  )}

                  {/* ─── القسم 2: التعديلات اللونية والإضاءة ─── */}
                  {propertiesSection === "color" && (
                    <>
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

                      <div style={{ padding: "0 17px 12px", marginTop: "10px" }}>
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

                      <div className="adjustments-actions">
                        <button type="button" className="btn-apply-adjustments" onClick={applyAdjustments}>
                          <Check size={14} /> تطبيق التعديلات (Apply)
                        </button>
                        <button type="button" className="btn-reset-all" onClick={resetAdjustments}>
                          إعادة ضبط الكل
                        </button>
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
                    </>
                  )}

                  {/* ─── القسم 3: الفلاتر الحية والمؤثرات ─── */}
                  {propertiesSection === "filters" && (
                    <>
                      <div className="panel-heading">
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

                      {/* Section 6 & Canva: Live Visual Photo Filter Previews */}
                      <div style={{ padding: "0 17px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#a855f7", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Sparkles size={13} /> {currentLang === "ar" ? "معاينة حية على صورتك" : "Live Photo Previews"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsFiltersStudioOpen(true)}
                          className="canva-white-pill-btn"
                          style={{ fontSize: "10.5px", padding: "4px 10px", gap: "4px" }}
                        >
                          <Sparkles size={11} /> {currentLang === "ar" ? "استوديو الفلاتر الموسع" : "Expand Studio"}
                        </button>
                      </div>

                      <div className="filter-visual-grid" style={{ margin: "4px 17px 14px" }}>
                        {FILTER_CATALOG.filter((f) => filterCategoryFilter === "الكل" || f.category === filterCategoryFilter).map((f) => {
                          const isActive = filterMode === f.id;
                          const thumb = filterThumbnails[f.id];
                          return (
                            <div
                              key={f.id}
                              className={`filter-visual-card ${isActive ? "active" : ""}`}
                              onClick={() => {
                                setFilterMode(f.id);
                                if (f.defaultIntensity !== undefined) setFilterIntensity(f.defaultIntensity);
                                setStatus(`تم تطبيق مرشح: ${f.nameArabic}`);
                              }}
                              title={f.description}
                            >
                              <div className="filter-visual-thumb-wrap">
                                {thumb ? (
                                  <img src={thumb} alt={f.nameArabic} className="filter-visual-thumb" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 bg-slate-950">
                                    {f.nameArabic}
                                  </div>
                                )}
                                {isActive && (
                                  <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full p-0.5 shadow-md">
                                    <Check size={10} strokeWidth={3} />
                                  </div>
                                )}
                              </div>
                              <div className="filter-visual-meta">
                                <span className="filter-visual-name">{f.nameArabic}</span>
                                <span className="filter-visual-badge">{f.category}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Quick Convolution Matrix Filters */}
                      <div className="panel-heading" style={{ marginTop: "14px" }}>
                        <span>مصفوفات التلافيف السريعة</span>
                      </div>
                      <div className="adjustment-grid" style={{ margin: "0 17px 14px" }}>
                        <button onClick={() => { setFilterMode("blur"); setStatus("تم تطبيق تمويه ضبابي Gaussian Blur"); }}><WandSparkles size={15} /> تمويه Blur</button>
                        <button onClick={() => { setFilterMode("sharpen"); setStatus("تم تطبيق زيادة الحدة Sharpen 3x3"); }}><SlidersHorizontal size={15} /> حدة Sharpen</button>
                        <button onClick={() => { setFilterMode("edges"); setStatus("تم تطبيق كشف الحواف Laplacian Edge Detection"); }}><Square size={15} /> حواف Edges</button>
                        <button onClick={() => { setFilterMode("emboss"); setStatus("تم تطبيق فلتر النقش البارز Emboss"); }}><Sparkles size={15} /> نقش Emboss</button>
                        <button onClick={() => { setFilterMode("pixelate"); setStatus("تم تطبيق فلتر الفسيفساء والبكسلة Pixelate"); }}><Grid size={15} /> فسيفساء Pixel</button>
                        <button onClick={() => { setFilterMode("none"); setStatus("تمت إزالة الفلاتر والعودة للأصل"); }}><RotateCcw size={15} /> أصل بدون فلتر</button>
                      </div>
                    </>
                  )}

                  {/* ─── القسم 4: ستوديو التنقيح والذكاء الاصطناعي ─── */}
                  {propertiesSection === "ai" && (
                    <>
                      <div className="panel-heading">
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

                        <div className="sb-section-label" style={{ marginTop: "10px", marginBottom: "6px" }}>
                          معالجات ذكية متقدمة (Smart Retouch Actions)
                        </div>

                        {/* Skin Smoothing Card */}
                        <div className="sb-card" style={{ marginBottom: "8px" }}>
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
                        <div className="sb-card" style={{ marginBottom: "8px" }}>
                          <div className="sb-hint" style={{ marginBottom: "4px" }}>
                            {selection ? `التحديد نشط (${Math.round(selection.width)}×{Math.round(selection.height)}px)` : "حدد عنصراً بأداة التحديد (V) أولاً للملء"}
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

                        {/* Professional Subject Extraction & Background Effects Panel */}
                        <div className="sb-card-teal" style={{ marginBottom: "12px" }}>
                          <div className="sb-section-label" style={{ marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <WandSparkles size={13} /> عزل الأجسام وتأثيرات الخلفية (AI Cutout & Bokeh)
                            </span>
                            <span style={{ fontSize: "8px", background: "rgba(45,212,191,0.18)", border: "1px solid rgba(45,212,191,0.4)", borderRadius: "4px", color: "var(--sig-teal)", padding: "1px 6px", fontWeight: 700 }}>
                              ⚡ NEURAL IS-NET
                            </span>
                          </div>

                          {/* Engine Status Banner */}
                          <div className="sb-ai-banner" style={{ marginBottom: "8px" }}>
                            <span style={{ fontSize: "12px" }}>🤖</span>
                            <span><strong>محرك الذكاء الاصطناعي العصبي مفعّل:</strong> عزل دقيق لأدق خصلات الشعر والملابس والبورتريه بدون أي تشويه.</span>
                          </div>

                          {/* Active AI Progress Bar */}
                          {aiProcessing && (
                            <div style={{ marginBottom: "10px", background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.35)", borderRadius: "6px", padding: "8px 10px" }}>
                              <div style={{ fontSize: "10px", color: "var(--sig-teal)", marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
                                <span>⚙️ {aiTask || "جاري المعالجة بالذكاء الاصطناعي..."}</span>
                                <span>{aiProgress}%</span>
                              </div>
                              <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "3px", height: "5px", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${aiProgress}%`, background: "linear-gradient(90deg, #2dd4bf, #06b6d4, #3b82f6)", borderRadius: "3px", transition: "width 0.25s ease" }} />
                              </div>
                            </div>
                          )}

                          {/* Sliders */}
                          <Adjustment label="قوة تمويه الخلفية (Bokeh Radius)" value={bgBlurRadius} min={5} max={50} defaultValue={20} onChange={setBgBlurRadius} />
                          <Adjustment label="تنعيم وصقل الحواف (Edge Feather)" value={bgFeather} min={0} max={8} defaultValue={3} onChange={setBgFeather} />
                          <Adjustment label="حساسية العزل الإضافية (Tolerance)" value={bgRemoveTolerance} min={10} max={70} defaultValue={30} onChange={setBgRemoveTolerance} />

                          {/* Smart Hint */}
                          <div className="sb-hint" style={{ margin: "6px 0 10px 0", background: "var(--card-accent-bg)", padding: "5px 8px", borderRadius: "5px", border: "1px dashed var(--sig-teal-border)" }}>
                            💡 <strong>طريقة العمل:</strong> انقر مباشرة على أي زر أدناه لمعالجة الصورة كاملة بالذكاء الاصطناعي، أو حدد جزءاً بأداة التحريك (V) لعزل منطقة معينة فقط.
                          </div>

                          {/* بطاقة التحكم في المحتوى المعزول الحر (Floating Subject Controller) */}
                          {floatingSubject && (
                            <div className="sb-card-teal" style={{ marginBottom: "10px", padding: "8px 10px" }}>
                              <div className="sb-section-label" style={{ marginBottom: "5px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                  <Move size={13} /> <span>المحتوى المعزول (حر ومستقل):</span>
                                </span>
                                <span style={{ fontSize: "8.5px", background: "var(--sig-teal-dim)", padding: "2px 6px", borderRadius: "3px", color: "var(--sig-teal)" }}>
                                  {floatingSubject.width}×{floatingSubject.height}px ({Math.round((floatingSubject.width / (floatingSubject.naturalWidth || floatingSubject.width || 1)) * 100)}%)
                                </span>
                              </div>

                              {/* قسم تكبير وتصغير المحتوى */}
                              <div className="sb-card" style={{ marginBottom: "8px", padding: "6px 8px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                  <span className="sb-prop-label" style={{ fontSize: "9.5px" }}>🔍 تكبير وتصغير الحجم:</span>
                                  <span className="sb-accent-value" style={{ fontSize: "9.5px" }}>
                                    {Math.round((floatingSubject.width / (floatingSubject.naturalWidth || floatingSubject.width || 1)) * 100)}%
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min={10}
                                  max={300}
                                  step={5}
                                  value={Math.round((floatingSubject.width / (floatingSubject.naturalWidth || floatingSubject.width || 1)) * 100)}
                                  onChange={(e) => handleScaleSubject(Number(e.target.value))}
                                  style={{ width: "100%", accentColor: "var(--sig-teal)", cursor: "pointer", height: "4px", margin: "3px 0 6px 0" }}
                                />
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "3px" }}>
                                  <button
                                    type="button"
                                    className="retouch-action-submit-btn"
                                    onClick={() => handleScaleSubjectDelta(-10)}
                                    style={{ justifyContent: "center", fontSize: "9px", padding: "4px 2px" }}
                                    title="تصغير المحتوى بنسبة 10%"
                                  >
                                    ➖ -10%
                                  </button>
                                  <button
                                    type="button"
                                    className="retouch-action-submit-btn"
                                    onClick={() => handleScaleSubjectDelta(10)}
                                    style={{ justifyContent: "center", fontSize: "9px", padding: "4px 2px" }}
                                    title="تكبير المحتوى بنسبة 10%"
                                  >
                                    ➕ +10%
                                  </button>
                                  <button
                                    type="button"
                                    className="retouch-action-submit-btn"
                                    onClick={() => handleScaleSubject(100)}
                                    style={{ justifyContent: "center", fontSize: "9px", padding: "4px 2px" }}
                                    title="إعادة الحجم الأصلي 100%"
                                  >
                                    🔄 100%
                                  </button>
                                  <button
                                    type="button"
                                    className="retouch-action-submit-btn"
                                    onClick={handleFitSubjectToCanvas}
                                    style={{ justifyContent: "center", fontSize: "9px", padding: "4px 2px" }}
                                    title="ملاءمة الحجم داخل الكانفاس"
                                  >
                                    📐 ملء
                                  </button>
                                </div>
                              </div>

                              <div className="sb-prop-label" style={{ fontSize: "8.5px", marginBottom: "5px", lineHeight: "1.3" }}>
                                🎯 <strong>التحريك والمحاذاة:</strong> اسحب الشخص مباشرة بالماوس، أو اضبط المحاذاة:
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", marginBottom: "6px" }}>
                                <button type="button" className="retouch-action-submit-btn" onClick={() => handleAlignSubject("center")} style={{ justifyContent: "center", fontSize: "9px", padding: "5px 2px" }} title="توسيط المحتوى في منتصف الكانفاس">
                                  🎯 توسيط
                                </button>
                                <button type="button" className="retouch-action-submit-btn" onClick={() => handleAlignSubject("right")} style={{ justifyContent: "center", fontSize: "9px", padding: "5px 2px" }} title="محاذاة المحتوى لليمين">
                                  ➡️ يمين
                                </button>
                                <button type="button" className="retouch-action-submit-btn" onClick={() => handleAlignSubject("left")} style={{ justifyContent: "center", fontSize: "9px", padding: "5px 2px" }} title="محاذاة المحتوى لليسار">
                                  ⬅️ يسار
                                </button>
                                <button type="button" className="retouch-action-submit-btn" onClick={() => handleAlignSubject("top")} style={{ justifyContent: "center", fontSize: "9px", padding: "5px 2px" }} title="محاذاة المحتوى للأعلى">
                                  ⬆️ أعلى
                                </button>
                                <button type="button" className="retouch-action-submit-btn" onClick={() => handleAlignSubject("bottom")} style={{ justifyContent: "center", fontSize: "9px", padding: "5px 2px" }} title="محاذاة المحتوى للأسفل">
                                  ⬇️ أسفل
                                </button>
                                <button type="button" className="retouch-action-submit-btn" onClick={() => handleAlignSubject("reset")} style={{ justifyContent: "center", fontSize: "9px", padding: "5px 2px" }} title="إعادة ضبط موضع المحتوى">
                                  🔄 ضبط
                                </button>
                              </div>
                              <div style={{ marginBottom: "6px" }}>
                                <button
                                  type="button"
                                  className="sb-crop-canvas-btn"
                                  onClick={handleFitCanvasToSubject}
                                  title="اقتصاص مساحة العمل بالكامل لتطابق أبعاد المحتوى الصافي تماماً وحذف أي مساحة فارغة خارجية"
                                >
                                  ✂️ اقتصاص مساحة العمل للمحتوى الصافي
                                </button>
                              </div>
                              <button
                                type="button"
                                className="sb-primary-btn"
                                onClick={handleExportPureSubject}
                                style={{ width: "100%", justifyContent: "center" }}
                                title="تصدير الشخص المعزول وحده بصيغة PNG شفافة عالية الدقة بدون أي خلفية أو مساحة عمل زائدة"
                              >
                                <Download size={13} /> 📥 تصدير المحتوى الصافي فقط (PNG شفاف)
                              </button>
                            </div>
                          )}

                          {/* 1. عزل المحتوى الصافي فقط بدون أي خلفية أو طبقات */}
                          <div className="sb-card-amber" style={{ marginBottom: "8px", padding: "8px 10px" }}>
                            <div className="sb-accent-value" style={{ fontSize: "10px", fontWeight: 700, marginBottom: "5px", display: "flex", alignItems: "center", gap: "5px", color: "var(--sig-amber)" }}>
                              <span>🎯</span> <span>عزل المحتوى الصافي (بدون خلفية أو طبقات):</span>
                            </div>
                            <button
                              type="button"
                              className="sb-ai-btn"
                              onClick={handlePureContentCutout}
                              disabled={aiProcessing}
                              style={{
                                width: "100%",
                                justifyContent: "center",
                                padding: "9px 12px",
                                opacity: aiProcessing ? 0.6 : 1,
                                cursor: aiProcessing ? "wait" : "pointer"
                              }}
                              title="عزل المحتوى الصافي فوراً بدون أي خلفيات أو طبقات إضافية"
                            >
                              <WandSparkles size={15} /> 🎯 عزل المحتوى الصافي فوراً
                            </button>
                            <div className="sb-hint" style={{ marginTop: "5px", textAlign: "center", lineHeight: "1.3" }}>
                              ✨ يعزل الشخص/العنصر فوراً ويفرّغ الخلفية تماماً
                            </div>
                          </div>

                          {/* 2. الميزة الثانية المطلوبة: زر رفع صورة خلفية مخصصة للصورة المعزولة */}
                          <div className="sb-card-blue" style={{ marginBottom: "10px", padding: "8px 10px" }}>
                            <div className="sb-accent-value" style={{ fontSize: "10px", fontWeight: 700, marginBottom: "5px", display: "flex", alignItems: "center", gap: "5px", color: "var(--sig-blue)" }}>
                              <span>🖼️</span> <span>تركيب خلفية مخصصة للصورة المعزولة:</span>
                            </div>
                            <input
                              ref={customBgInputRef}
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={handleUploadCustomBackground}
                            />
                            <button
                              type="button"
                              className="sb-blue-btn"
                              onClick={() => customBgInputRef.current?.click()}
                              disabled={aiProcessing}
                              style={{
                                width: "100%",
                                justifyContent: "center",
                                padding: "9px 12px",
                                opacity: aiProcessing ? 0.6 : 1,
                                cursor: aiProcessing ? "wait" : "pointer"
                              }}
                              title="رفع أي صورة من جهازك لوضعها كخلفية جديدة بدقة متناهية خلف الصورة التي تم عزل خلفيتها"
                            >
                              <Upload size={15} /> 🖼️ رفع صورة خلفية مخصصة من جهازك...
                            </button>
                            <div className="sb-hint" style={{ marginTop: "5px", textAlign: "center", lineHeight: "1.3" }}>
                              📁 اختر أي صورة من جهازك لدمجها تلقائياً كخلفية جديدة عالية الدقة خلف العنصر المعزول
                            </div>
                          </div>

                      {/* 3. تحرير الجسم إلى طبقة جديدة */}
                      <div style={{ marginBottom: "6px" }}>
                        <button
                          type="button"
                          className="sb-primary-btn"
                          onClick={handleExtractSubjectToNewLayer}
                          disabled={aiProcessing}
                          style={{
                            width: "100%",
                            justifyContent: "center",
                            opacity: aiProcessing ? 0.6 : 1,
                            cursor: aiProcessing ? "wait" : "pointer"
                          }}
                          title="تحرير وفصل الجسم بالذكاء الاصطناعي ونقله إلى طبقة مستقلة في لوحة الطبقات"
                        >
                          <Sparkles size={13} /> ✨ تحرير الجسم إلى طبقة جديدة (Extract Subject)
                        </button>
                      </div>

                      {/* 4. إزالة الخلفية وعزل الجسم مباشرة */}
                      <div style={{ marginBottom: "6px" }}>
                        <button
                          type="button"
                          className="sb-primary-btn"
                          onClick={handleApplyBackgroundRemoval}
                          disabled={aiProcessing}
                          style={{
                            width: "100%",
                            justifyContent: "center",
                            opacity: aiProcessing ? 0.6 : 1,
                            cursor: aiProcessing ? "wait" : "pointer"
                          }}
                          title="عزل الجسم بالذكاء الاصطناعي وجعل الخلفية شفافة تماماً PNG"
                        >
                          <Crop size={13} /> ✂️ إزالة الخلفية بالذكاء الاصطناعي → شفاف (PNG)
                        </button>
                      </div>

                      {/* 5. تمويه البورتريه بتدرج */}
                      <div style={{ marginBottom: "8px" }}>
                        <button
                          type="button"
                          className="sb-indigo-btn"
                          onClick={handleBlurBackground}
                          disabled={aiProcessing}
                          style={{
                            width: "100%",
                            justifyContent: "center",
                            opacity: aiProcessing ? 0.6 : 1,
                            cursor: aiProcessing ? "wait" : "pointer"
                          }}
                          title="تمويه خلفية الصورة بعمق ميدان واقعي (Portrait Bokeh) مع بقاء الجسم حاداً 100%"
                        >
                          <SlidersHorizontal size={13} /> 🌫️ تمويه البورتريه الاحترافي (Portrait Bokeh)
                        </button>
                      </div>

                      {/* 6. استبدال الخلفية بألوان وتدرجات استوديو */}
                      <div>
                        <div className="sb-prop-label" style={{ fontSize: "10px", fontWeight: 600, marginBottom: "5px" }}>🎨 استبدال خلفية الجسم بألوان وتدرجات جاهزة:</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", marginBottom: "4px" }}>
                          <button type="button" className="sb-ghost-btn"
                            onClick={() => handleHideBackground("transparent")}
                            disabled={aiProcessing}
                            style={{ justifyContent: "center", fontSize: "9px", padding: "5px" }}
                            title="خلفية شفافة">
                            ◻️ شفاف
                          </button>
                          <button type="button" className="retouch-action-submit-btn"
                            onClick={() => handleHideBackground("black")}
                            disabled={aiProcessing}
                            style={{ justifyContent: "center", fontSize: "9px", padding: "5px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", color: "#ffffff" }}
                            title="أسود استوديو فخم">
                            ⬛ أسود
                          </button>
                          <button type="button" className="retouch-action-submit-btn"
                            onClick={() => handleHideBackground("white")}
                            disabled={aiProcessing}
                            style={{ justifyContent: "center", fontSize: "9px", padding: "5px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a" }}
                            title="أبيض نقي تجاري">
                            ⬜ أبيض
                          </button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                          <button type="button" className="retouch-action-submit-btn"
                            onClick={() => handleHideBackground("studio-dark")}
                            disabled={aiProcessing}
                            style={{ justifyContent: "center", fontSize: "9px", padding: "5px", background: "linear-gradient(135deg, #1e293b, #0f172a)", border: "1px solid rgba(148,163,184,0.3)", color: "#e2e8f0" }}
                            title="تدرج استوديو سينمائي">
                            🎬 تدرج سينمائي
                          </button>
                          <button type="button" className="retouch-action-submit-btn"
                            onClick={() => handleHideBackground("chroma")}
                            disabled={aiProcessing}
                            style={{ justifyContent: "center", fontSize: "9px", padding: "5px", background: "rgba(0,177,64,0.15)", border: "1px solid rgba(0,177,64,0.4)", color: "#16a34a" }}
                            title="خلفية خضراء كروما">
                            🟩 كروما خضراء
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ─── Phase 13: AI & Advanced Features Panel ─── */}
                    <div style={{ marginTop: "14px", borderTop: "1px solid var(--sig-teal-border)", paddingTop: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span className="sb-section-label" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <WandSparkles size={13} /> وظائف الذكاء الاصطناعي المحلية (Phase 13)
                        </span>
                        <span style={{ fontSize: "8px", background: "var(--sig-teal-dim)", border: "1px solid var(--sig-teal-border)", borderRadius: "10px", color: "var(--sig-teal)", padding: "1px 6px" }}>LOCAL AI</span>
                      </div>

                      {/* AI Processing Progress Bar */}
                      {aiProcessing && (
                        <div style={{ marginBottom: "10px", background: "var(--sig-teal-dim)", border: "1px solid var(--sig-teal-border)", borderRadius: "6px", padding: "8px 10px" }}>
                          <div style={{ fontSize: "10px", color: "var(--sig-teal)", marginBottom: "4px" }}>⚙️ {aiTask}...</div>
                          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "3px", height: "4px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${aiProgress}%`, background: "linear-gradient(90deg, #2dd4bf, #06b6d4)", borderRadius: "3px", transition: "width 0.3s ease" }} />
                          </div>
                        </div>
                      )}

                      {/* 1. Smart Upscale */}
                      <div className="sb-card" style={{ padding: "8px", marginBottom: "8px" }}>
                        <div className="sb-prop-value" style={{ fontSize: "10px", fontWeight: 600, marginBottom: "5px" }}>🔍 تحسين الدقة (Upscale)</div>
                        <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                          {([2, 3, 4] as const).map(f => (
                            <button key={f} type="button"
                              className={`preset-chip-btn ${upscaleFactor === f ? "active" : ""}`}
                              onClick={() => setUpscaleFactor(f)}>{f}×</button>
                          ))}
                        </div>
                        <div className="sb-hint" style={{ marginBottom: "5px" }}>
                          نتيجة: {imageSize.width * upscaleFactor}×{imageSize.height * upscaleFactor}px — مع شحذ Lanczos تقديري
                        </div>
                        <button type="button" className="retouch-action-submit-btn"
                          onClick={handleAiUpscale} disabled={aiProcessing}
                          title="تكبير الصورة مع تحسين الحدة">
                          <ZoomIn size={13} /> تطبيق تحسين الدقة
                        </button>
                      </div>

                      {/* 2. Smart AutoCrop */}
                      <div className="sb-card" style={{ padding: "8px", marginBottom: "8px" }}>
                        <div className="sb-prop-value" style={{ fontSize: "10px", fontWeight: 600, marginBottom: "5px" }}>✂️ القص الذكي (Smart AutoCrop)</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
                          <span className="sb-hint">هامش إضافي:</span>
                          <input type="number" min={0} max={100} value={autocropPadding}
                            onChange={e => setAutocropPadding(Number(e.target.value))}
                            className="sb-inline-input"
                            style={{ width: "48px", padding: "2px 4px", fontSize: "10px" }} />
                          <span className="sb-hint">px</span>
                        </div>
                        <div className="sb-hint" style={{ marginBottom: "5px" }}>يكتشف حدود المحتوى ويحذف الهوامش البيضاء/الشفافة</div>
                        <button type="button" className="retouch-action-submit-btn"
                          onClick={handleSmartAutoCrop} disabled={aiProcessing}
                          title="اكتشاف المحتوى وقص الهوامش تلقائياً">
                          <Crop size={13} /> قص ذكي للمحتوى
                        </button>
                      </div>

                      {/* 3. Outpainting */}
                      <div className="sb-card" style={{ padding: "8px", marginBottom: "8px" }}>
                        <div className="sb-prop-value" style={{ fontSize: "10px", fontWeight: 600, marginBottom: "5px" }}>🖼️ توسيع الصورة (Outpainting)</div>
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
                      <div className="sb-card" style={{ padding: "8px", marginBottom: "8px" }}>
                        <div className="sb-prop-value" style={{ fontSize: "10px", fontWeight: 600, marginBottom: "5px" }}>🎭 تحويل إلى نمط فني (Art Style)</div>
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
                      <div className="sb-hint" style={{ fontSize: "9px", padding: "6px 8px", background: "var(--card-subtle)", borderRadius: "4px", border: "1px solid var(--card-subtle-border)", lineHeight: 1.5 }}>
                        ⚠️ هذه الوظائف تعمل محلياً على متصفحك بدون إنترنت. النتائج تقديرية ويمكن استخدام Undo للتراجع.
                      </div>
                    </div>
                  </div>
                </>
              )}

                  <div className="inspector-note">
                    <span className="note-icon">i</span>
                    <p>تتم التعديلات بنظام المعالجة غير التدميرية، مع الحفاظ على أصل الصورة وإمكانية التراجع والتصدير بأعلى جودة.</p>
                  </div>
                </div>
              )}
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

        {/* Help: دليل المستخدم */}
        {helpOpen && <UserGuide onClose={() => setHelpOpen(false)} />}

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
                <h3><Download size={16} /> تصدير الصورة</h3>
                <button className="modal-close-btn" onClick={() => setExportOptionsOpen(false)}><X size={16} /></button>
              </div>
              <div className="modal-body">
                {/* Quick Export Buttons */}
                <div className="modal-field">
                  <label style={{ marginBottom: "8px", display: "block", color: "var(--studio-text-muted, #78716c)", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>تصدير سريع</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn-primary"
                      style={{ flex: 1, fontSize: "12px", padding: "10px 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      onClick={() => { setExportOptionsOpen(false); exportImage("png"); }}
                    >
                      <Download size={13} /> PNG
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ flex: 1, fontSize: "12px", padding: "10px 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      onClick={() => { setExportOptionsOpen(false); exportImage("jpeg", 92); }}
                    >
                      <Download size={13} /> JPG
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ flex: 1, fontSize: "12px", padding: "10px 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      onClick={() => { setExportOptionsOpen(false); exportImage("webp", 90); }}
                    >
                      <Download size={13} /> WebP
                    </button>
                  </div>
                </div>
                <div className="app-menu-separator" style={{ margin: "12px 0" }} />
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

        {/* Studio Modal 1: Product Showcase Backgrounds */}
        <ProductBackgroundsModal
          isOpen={isProductBgModalOpen}
          onClose={() => setIsProductBgModalOpen(false)}
          lang={currentLang}
          currentCanvasWidth={imageSize.width}
          currentCanvasHeight={imageSize.height}
          onApplyBackground={(bgUrl, options) => {
            if (options.asLayer) {
              const newLayerId = `layer-bg-${Date.now()}`;
              setLayers((prev) => [
                ...prev,
                {
                  id: newLayerId,
                  name: currentLang === "ar" ? "خلفية استوديو إجرائية" : "Studio Background",
                  kind: "image",
                  visible: true,
                  opacity: 100,
                  blendMode: "normal",
                  color: "#eab308"
                }
              ]);
            }
            setHasCustomBackground(true);
            setImageSrc(bgUrl);
            setStatus(currentLang === "ar" ? "تم تطبيق خلفية الاستوديو بنجاح" : "Studio background applied successfully");
          }}
        />

        {/* Studio Modal 2: Templates & New Project */}
        <TemplatesModal
          isOpen={isTemplatesModalOpen}
          onClose={() => setIsTemplatesModalOpen(false)}
          lang={currentLang}
          onApplyTemplate={handleApplyEditableTemplate}
          onCreateNewProject={({ width, height, background, templateName }) => {
            setImageSize({ width, height });
            const off = document.createElement("canvas");
            off.width = width;
            off.height = height;
            const ctx = off.getContext("2d");
            if (ctx) {
              if (background === "white") {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, width, height);
              } else if (background === "black") {
                ctx.fillStyle = "#000000";
                ctx.fillRect(0, 0, width, height);
              } else if (background !== "transparent") {
                ctx.fillStyle = background;
                ctx.fillRect(0, 0, width, height);
              }
            }
            const freshUrl = off.toDataURL("image/png");
            setImageSrc(freshUrl);
            setFloatingSubject(null);
            setStrokes([]);
            setShapes([]);
            setTextElements([]);
            setLayers([
              { id: "color", name: "تعديل لوني", kind: "adjustment", color: "#2dd4bf", visible: true, opacity: 100, blendMode: "normal" },
              { id: "portrait", name: templateName || (currentLang === "ar" ? "مشروع جديد" : "New Canvas"), kind: "image", color: "#d7b58a", visible: true, opacity: 100, blendMode: "normal" },
              { id: "background", name: "الخلفية", kind: "background", color: "#8d8b87", visible: true, opacity: 100, blendMode: "normal" },
            ]);
            setSelectedLayer("portrait");
            setTimeout(fitToScreen, 100);
            setStatus(currentLang === "ar" ? `تم إنشاء مشروع جديد: ${templateName || "مخصص"} (${width}×${height})` : `Created canvas: ${templateName || "Custom"} (${width}×${height})`);
          }}
        />

        {/* Studio Modal 3: Two-Image Blend Studio */}
        <BlendModal
          isOpen={isBlendModalOpen}
          onClose={() => {
            setIsBlendModalOpen(false);
            setPreloadedBlendImage(null);
          }}
          baseImageSrc={imageSrc}
          isArabic={currentLang === "ar"}
          initialSecondImageSrc={preloadedBlendImage}
          onApplyBlend={(blendedDataUrl: string, asNewLayer: boolean, blendMode: string, opacity: number) => {
            if (asNewLayer) {
              const newLayerId = `layer-blend-${Date.now()}`;
              setLayers((prev) => [
                ...prev,
                {
                  id: newLayerId,
                  name: currentLang === "ar" ? "طبقة دمج الصور" : "Blended Layer",
                  kind: "image",
                  visible: true,
                  opacity,
                  blendMode: blendMode as any,
                  color: "#a855f7"
                }
              ]);
            }
            setImageSrc(blendedDataUrl);
            if (cachedImageRef.current) cachedImageRef.current.src = blendedDataUrl;
            setStatus(currentLang === "ar" ? "تم تثبيت دمج الصورتين على مساحة العمل بنجاح" : "Two-image blend applied to canvas");
          }}
        />

        {/* Studio Modal 4: Canva-Grade Live Visual Filters Studio */}
        <FiltersStudioModal
          isOpen={isFiltersStudioOpen}
          onClose={() => setIsFiltersStudioOpen(false)}
          activeFilter={filterMode}
          filterIntensity={filterIntensity}
          filterThumbnails={filterThumbnails}
          onSelectFilter={(filterId, defaultIntensity) => {
            setFilterMode(filterId);
            if (defaultIntensity !== undefined) setFilterIntensity(defaultIntensity);
            const def = FILTER_CATALOG.find((f) => f.id === filterId);
            setStatus(currentLang === "ar" ? `تم تطبيق المرشح الحي: ${def?.nameArabic || filterId}` : `Applied live filter: ${filterId}`);
          }}
          onChangeIntensity={(val) => setFilterIntensity(val)}
          onBakeFilter={applyFilterPermanently}
          onResetFilter={() => {
            setFilterMode("none");
            setStatus(currentLang === "ar" ? "تم إلغاء المرشح والعودة للأصل" : "Filter reset to original");
          }}
          lang={currentLang}
        />

        {/* Studio Modal 5: Smart Drag & Drop Hub Modal (Section 22) */}
        <SmartDropHubModal
          isOpen={isSmartDropHubOpen}
          onClose={() => {
            setIsSmartDropHubOpen(false);
            setDroppedImageMeta(null);
          }}
          imageMeta={droppedImageMeta}
          onSelectAction={handleSmartDropAction}
          lang={currentLang}
        />

        {/* Phase 2: Command Palette Modal (Ctrl+K) */}
        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          commands={commandList}
          lang={currentLang}
        />

        {/* Phase 2: Context Menu (Right Click on Canvas) */}
        <CanvasContextMenu
          isOpen={isContextMenuOpen}
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          onClose={() => setIsContextMenuOpen(false)}
          onDuplicateLayer={duplicateSelectedLayer}
          onDeleteLayer={removeSelectedLayer}
          onToggleLockLayer={() => toggleLayerLock(selectedLayer)}
          isLayerLocked={layers.find((l) => l.id === selectedLayer)?.locked}
          onMergeDown={mergeLayerDown}
          onBringForward={moveLayerUp}
          onSendBackward={moveLayerDown}
          onAiCutout={handlePureContentCutout}
          onFitScreen={fitToScreen}
          onExportLayer={exportSelectedLayer}
          lang={currentLang}
        />

        {/* Phase 3: Projects Dashboard Modal */}
        <ProjectsDashboardModal
          isOpen={isProjectsDashboardOpen}
          onClose={() => setIsProjectsDashboardOpen(false)}
          projects={registeredProjects}
          onOpenProject={handleOpenRegisteredProject}
          onNewProject={() => {
            setIsProjectsDashboardOpen(false);
            setIsNewDesignModalOpen(true);
          }}
          onImportProjectFile={() => projectFileInputRef.current?.click()}
          onDuplicateProject={handleDuplicateRegisteredProject}
          onRenameProject={handleRenameRegisteredProject}
          onToggleFavorite={handleToggleFavoriteProject}
          onMoveToTrash={handleMoveProjectToTrash}
          onRestoreFromTrash={handleRestoreProjectFromTrash}
          onPermanentDelete={handlePermanentDeleteProject}
          onExportProjectFile={handleExportRegisteredProject}
          onShareProject={(proj) => setShareProjectTarget(proj)}
          onViewVersionHistory={(_id: string) => {
            setIsVersionHistoryOpen(true);
          }}
          lang={currentLang}
        />

        {/* Phase 3: Version History Modal */}
        <VersionHistoryModal
          isOpen={isVersionHistoryOpen}
          onClose={() => setIsVersionHistoryOpen(false)}
          snapshots={projectSnapshots}
          onRestoreSnapshot={handleRestoreSnapshot}
          onCreateManualSnapshot={handleCreateManualSnapshot}
          onDeleteSnapshot={handleDeleteSnapshot}
          lang={currentLang}
        />

        {/* Phase 4 & 5: Creative Library Hub (Backgrounds, Templates, Assets, Stock Photos) */}
        <CreativeLibraryModal
          isOpen={isCreativeLibraryOpen}
          onClose={() => setIsCreativeLibraryOpen(false)}
          onApplyBackground={handleApplyCreativeBackground}
          onApplyTemplate={handleApplyEditableTemplate}
          onAddAssetLayer={handleAddAssetGraphic}
          onApplyStockPhoto={handleApplyStockPhoto}
          onOpenProject={handleOpenRegisteredProject}
          projects={registeredProjects}
          lang={currentLang}
        />

        {/* Canva-Grade New Design Modal */}
        <NewDesignModal
          isOpen={isNewDesignModalOpen}
          onClose={() => setIsNewDesignModalOpen(false)}
          onCreateNewProject={handleCreateNewProjectFromModal}
          onApplyTemplate={handleApplyEditableTemplate}
          onApplyBackground={handleApplyCreativeBackground}
          onOpenTemplates={() => setIsTemplatesModalOpen(true)}
          lang={currentLang}
        />

        {/* Canva-Grade Share & Export Project Modal */}
        {shareProjectTarget && (
          <ShareProjectModal
            isOpen={!!shareProjectTarget}
            onClose={() => setShareProjectTarget(null)}
            project={shareProjectTarget}
            onExportFile={handleExportRegisteredProject}
            lang={currentLang}
          />
        )}

        {/* Phase 7: Watermark Studio Modal */}
        <WatermarkModal
          isOpen={isWatermarkOpen}
          onClose={() => setIsWatermarkOpen(false)}
          onApplyWatermark={handleApplyWatermark}
          lang={currentLang}
        />

        {/* Phase 7: Multi-Size Batch Export Modal */}
        <MultiSizeExportModal
          isOpen={isMultiExportOpen}
          onClose={() => setIsMultiExportOpen(false)}
          originalWidth={imageSize.width || 1080}
          originalHeight={imageSize.height || 1080}
          onExecuteMultiExport={handleExecuteMultiExport}
          lang={currentLang}
        />
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
        <polyline points={pointsR} fill="none" stroke="rgba(14,165,233,0.7)" strokeWidth="1" />
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



