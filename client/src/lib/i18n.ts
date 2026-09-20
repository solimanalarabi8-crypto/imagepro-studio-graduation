/**
 * ImagePro Studio — Centralized Bilingual Translation Dictionary (i18n)
 * Full Arabic (RTL) & English (LTR) localization
 */

export type Language = "ar" | "en";

export interface Translations {
  appName: string;
  appSubtitle: string;
  file: string;
  edit: string;
  image: string;
  view: string;
  help: string;
  newProject: string;
  openImage: string;
  saveProject: string;
  exportImage: string;
  mergeImages: string;
  backgroundsLibrary: string;
  templatesStudio: string;
  langToggle: string;
  themeToggle: string;
  darkMode: string;
  lightMode: string;

  // Tools
  toolSelect: string;
  toolHand: string;
  toolCrop: string;
  toolTransform: string;
  toolBrush: string;
  toolPencil: string;
  toolEraser: string;
  toolBucket: string;
  toolText: string;
  toolShape: string;
  toolEyedropper: string;
  toolClone: string;
  toolHealing: string;
  toolZoom: string;

  // Tool Options
  size: string;
  hardness: string;
  opacity: string;
  flow: string;
  color: string;
  tolerance: string;
  eraserMode: string;
  modePixels: string;
  modePaint: string;
  modeMagic: string;
  apply: string;
  cancel: string;

  // Inspector Tabs
  layers: string;
  properties: string;
  history: string;

  // Actions
  undo: string;
  redo: string;
  fitScreen: string;
  actualSize: string;
  fullscreen: string;
  compareBefore: string;
}

export const DICTIONARY: Record<Language, Translations> = {
  ar: {
    appName: "ImagePro Studio",
    appSubtitle: "محرر الصور المتقدم",
    file: "ملف",
    edit: "تحرير",
    image: "صورة",
    view: "عرض",
    help: "مساعدة",
    newProject: "مشروع جديد",
    openImage: "فتح صورة",
    saveProject: "حفظ المشروع",
    exportImage: "تصدير",
    mergeImages: "دمج صورتين",
    backgroundsLibrary: "مكتبة الخلفيات",
    templatesStudio: "استوديو القوالب",
    langToggle: "English",
    themeToggle: "المظهر",
    darkMode: "الوضع الليلي",
    lightMode: "الوضع النهاري",

    toolSelect: "تحديد وتحريك (V)",
    toolHand: "أداة اليد (H)",
    toolCrop: "أداة القص (C)",
    toolTransform: "التحويل الحر (Ctrl+T)",
    toolBrush: "فرشاة الرسم (B)",
    toolPencil: "قلم الرصاص (P)",
    toolEraser: "الممحاة الشاملة (E)",
    toolBucket: "دلو الطلاء (G)",
    toolText: "كتابة نص (T)",
    toolShape: "أشكال متجهة (U)",
    toolEyedropper: "قطارة الألوان (I)",
    toolClone: "ختم الاستنساخ (S)",
    toolHealing: "فرشاة المعالجة (J)",
    toolZoom: "أداة التقريب (Z)",

    size: "الحجم",
    hardness: "الصلابة",
    opacity: "الشفافية",
    flow: "التدفق",
    color: "اللون",
    tolerance: "الحساسية",
    eraserMode: "وضع المسح",
    modePixels: "بكسلات الصورة",
    modePaint: "طبقة الرسم",
    modeMagic: "ممحاة سحرية",
    apply: "تطبيق",
    cancel: "إلغاء",

    layers: "الطبقات",
    properties: "الخصائص",
    history: "السجل",

    undo: "تراجع",
    redo: "تقدم",
    fitScreen: "ملاءمة الشاشة",
    actualSize: "الحجم الفعلي 100%",
    fullscreen: "ملء الشاشة",
    compareBefore: "مقارنة قبل / بعد",
  },
  en: {
    appName: "ImagePro Studio",
    appSubtitle: "Advanced Photo Editor",
    file: "File",
    edit: "Edit",
    image: "Image",
    view: "View",
    help: "Help",
    newProject: "New Project",
    openImage: "Open Image",
    saveProject: "Save Project",
    exportImage: "Export",
    mergeImages: "Blend Images",
    backgroundsLibrary: "Backgrounds",
    templatesStudio: "Templates",
    langToggle: "العربية",
    themeToggle: "Theme",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",

    toolSelect: "Move & Select (V)",
    toolHand: "Hand Tool (H)",
    toolCrop: "Crop Tool (C)",
    toolTransform: "Free Transform (Ctrl+T)",
    toolBrush: "Brush Tool (B)",
    toolPencil: "Pencil Tool (P)",
    toolEraser: "Surgical Eraser (E)",
    toolBucket: "Paint Bucket (G)",
    toolText: "Text Tool (T)",
    toolShape: "Vector Shapes (U)",
    toolEyedropper: "Eyedropper (I)",
    toolClone: "Clone Stamp (S)",
    toolHealing: "Healing Brush (J)",
    toolZoom: "Zoom Tool (Z)",

    size: "Size",
    hardness: "Hardness",
    opacity: "Opacity",
    flow: "Flow",
    color: "Color",
    tolerance: "Tolerance",
    eraserMode: "Erase Mode",
    modePixels: "Image Pixels",
    modePaint: "Paint Layer",
    modeMagic: "Magic Eraser",
    apply: "Apply",
    cancel: "Cancel",

    layers: "Layers",
    properties: "Properties",
    history: "History",

    undo: "Undo",
    redo: "Redo",
    fitScreen: "Fit to Screen",
    actualSize: "Actual Size 100%",
    fullscreen: "Fullscreen",
    compareBefore: "Compare Before/After",
  },
};

export const i18n = DICTIONARY;
export default DICTIONARY;

