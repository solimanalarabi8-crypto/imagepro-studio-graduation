/**
 * ImagePro Studio — Multi-Layer Editable Templates Studio
 * True layered designs (Background, Vector Shapes, Text/Headlines, Placeholders)
 */

export type TemplateCategory =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "ads"
  | "ecommerce"
  | "business";

export interface TemplateLayerDefinition {
  id: string;
  name: string;
  kind: "background" | "shape" | "text" | "placeholder";
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  shapeType?: "rectangle" | "ellipse" | "badge" | "ribbon";
  opacity?: number;
}

export interface EditableTemplate {
  id: string;
  nameAr: string;
  nameEn: string;
  category: TemplateCategory;
  width: number;
  height: number;
  aspect: string;
  tags: string[];
  layers: TemplateLayerDefinition[];
  renderPreview: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export const TEMPLATE_CATEGORIES: { id: TemplateCategory | "all"; nameAr: string; nameEn: string; icon: string }[] = [
  { id: "all", nameAr: "كافة القوالب", nameEn: "All Templates", icon: "✨" },
  { id: "instagram", nameAr: "إنستغرام (1:1)", nameEn: "Instagram Post", icon: "📸" },
  { id: "tiktok", nameAr: "تيك توك / ريلز (9:16)", nameEn: "TikTok & Stories", icon: "📱" },
  { id: "youtube", nameAr: "يوتيوب (16:9)", nameEn: "YouTube Thumbnail", icon: "🎬" },
  { id: "ads", nameAr: "إعلانات تسويقية", nameEn: "Marketing Ads", icon: "🚀" },
  { id: "ecommerce", nameAr: "متجر إلكتروني وبانرات", nameEn: "E-Commerce", icon: "🛍️" },
  { id: "business", nameAr: "هوية وبطاقات أعمال", nameEn: "Business & Corporate", icon: "💼" },
];

export const EDITABLE_TEMPLATES: EditableTemplate[] = [
  // 1. Instagram Commercial Sale (1080x1080)
  {
    id: "insta-sale-bold",
    nameAr: "عرض ترويجي لمتجر مع خصم كبير",
    nameEn: "Flash Sale Commercial Promo",
    category: "instagram",
    width: 1080,
    height: 1080,
    aspect: "1:1",
    tags: ["sale", "promo", "store", "discount", "خصم"],
    layers: [
      { id: "bg", name: "الخلفية المتدرجة", kind: "background", color: "#0f172a" },
      { id: "frame", name: "إطار التصميم", kind: "shape", shapeType: "rectangle", x: 40, y: 40, width: 1000, height: 1000, color: "rgba(45,212,191,0.3)" },
      { id: "badge", name: "شارة الخصم", kind: "shape", shapeType: "badge", x: 100, y: 100, width: 180, height: 60, color: "#f59e0b" },
      { id: "badge-txt", name: "نص الخصم", kind: "text", text: "خصم 50% لفترة محدودة", x: 190, y: 140, fontSize: 24, color: "#000000" },
      { id: "headline", name: "العنوان الرئيسي", kind: "text", text: "تشكيلة الصيف الحصرية", x: 540, y: 820, fontSize: 52, color: "#ffffff", fontWeight: "bold" },
      { id: "cta", name: "زر الطلب", kind: "shape", shapeType: "rectangle", x: 440, y: 900, width: 200, height: 60, color: "#2dd4bf" },
      { id: "cta-txt", name: "نص الزر", kind: "text", text: "اطلب الآن", x: 540, y: 940, fontSize: 26, color: "#0f172a", fontWeight: "bold" }
    ],
    renderPreview: (ctx, w, h) => {
      // Dark slate background
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#0f172a");
      grad.addColorStop(1, "#020617");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Cyan accent frame
      ctx.strokeStyle = "rgba(45,212,191,0.4)";
      ctx.lineWidth = 4;
      ctx.strokeRect(w * 0.05, h * 0.05, w * 0.9, h * 0.9);

      // Badge
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.roundRect(w * 0.08, h * 0.08, w * 0.28, h * 0.07, 8);
      ctx.fill();

      // Title & CTA
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(h * 0.055)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("تشكيلة الصيف الحصرية", w / 2, h * 0.82);

      // CTA button
      ctx.fillStyle = "#2dd4bf";
      ctx.beginPath();
      ctx.roundRect(w * 0.35, h * 0.88, w * 0.3, h * 0.06, 6);
      ctx.fill();
    }
  },

  // 2. TikTok / Story Fashion (1080x1920)
  {
    id: "story-fashion-vogue",
    nameAr: "قصة أزياء عمودية وأناقة مينيمال",
    nameEn: "Minimal Fashion Story",
    category: "tiktok",
    width: 1080,
    height: 1920,
    aspect: "9:16",
    tags: ["story", "tiktok", "fashion", "reels", "قصة"],
    layers: [
      { id: "bg", name: "خلفية باستيل دافئة", kind: "background", color: "#f8fafc" },
      { id: "v-title", name: "عنوان القصة", kind: "text", text: "NEW COLLECTION", x: 540, y: 300, fontSize: 58, color: "#1e293b", fontWeight: "bold" },
      { id: "sub", name: "الوصف الفرعي", kind: "text", text: "تصاميم تعكس ذوقك الرفيع", x: 540, y: 380, fontSize: 32, color: "#64748b" },
      { id: "swipe", name: "اسحب للشراء", kind: "text", text: "اسحب للأعلى للتفاصيل ↑", x: 540, y: 1750, fontSize: 28, color: "#0f766e" }
    ],
    renderPreview: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#f8fafc");
      grad.addColorStop(1, "#e2e8f0");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Center photo frame
      ctx.strokeStyle = "rgba(15,118,110,0.3)";
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.1, h * 0.25, w * 0.8, h * 0.55);

      ctx.fillStyle = "#0f172a";
      ctx.font = `bold ${Math.round(h * 0.035)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("NEW COLLECTION", w / 2, h * 0.18);

      ctx.fillStyle = "#0f766e";
      ctx.font = `${Math.round(h * 0.02)}px sans-serif`;
      ctx.fillText("اسحب للأعلى للتفاصيل ↑", w / 2, h * 0.92);
    }
  },

  // 3. YouTube Tech Thumbnail (1280x720)
  {
    id: "yt-tech-viral",
    nameAr: "غلاف يوتيوب تقني ناري وجذاب",
    nameEn: "Viral Tech YouTube Thumbnail",
    category: "youtube",
    width: 1280,
    height: 720,
    aspect: "16:9",
    tags: ["youtube", "thumbnail", "tech", "viral", "غلاف"],
    layers: [
      { id: "bg", name: "الخلفية النيونية", kind: "background", color: "#050814" },
      { id: "badge", name: "شارة التقييم", kind: "shape", shapeType: "badge", x: 100, y: 80, width: 220, height: 70, color: "#ef4444" },
      { id: "badge-txt", name: "نص الشارة", kind: "text", text: "مقارنة شاملة 🔥", x: 210, y: 125, fontSize: 26, color: "#ffffff", fontWeight: "bold" },
      { id: "title", name: "العنوان الصادم", kind: "text", text: "هل يستحق الشراء؟", x: 380, y: 380, fontSize: 68, color: "#facc15", fontWeight: "bold" }
    ],
    renderPreview: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#090d1f");
      grad.addColorStop(1, "#03040a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Yellow glow
      const glow = ctx.createRadialGradient(w * 0.3, h * 0.5, 20, w * 0.3, h * 0.5, w * 0.4);
      glow.addColorStop(0, "rgba(250,204,21,0.25)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Red badge
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.roundRect(w * 0.05, h * 0.1, w * 0.22, h * 0.12, 8);
      ctx.fill();

      // Big text
      ctx.fillStyle = "#facc15";
      ctx.font = `bold ${Math.round(h * 0.12)}px sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText("هل يستحق الشراء؟", w * 0.05, h * 0.55);
    }
  },

  // 4. Marketing Ads Banner (1200x628)
  {
    id: "ads-growth-corporate",
    nameAr: "إعلان نمو شركات وتحويل رقمي",
    nameEn: "Corporate Growth Ad Banner",
    category: "ads",
    width: 1200,
    height: 628,
    aspect: "1.91:1",
    tags: ["ads", "marketing", "business", "growth", "إعلان"],
    layers: [
      { id: "bg", name: "خلفية استثمارية زرقاء", kind: "background", color: "#0c1e33" },
      { id: "headline", name: "عنوان النمو", kind: "text", text: "ضاعف مبيعاتك مع حلولنا", x: 300, y: 260, fontSize: 48, color: "#ffffff", fontWeight: "bold" },
      { id: "cta", name: "زر التجربة", kind: "shape", shapeType: "rectangle", x: 120, y: 380, width: 220, height: 60, color: "#38bdf8" },
      { id: "cta-txt", name: "نص التجربة", kind: "text", text: "ابدأ مجاناً 14 يوماً", x: 230, y: 420, fontSize: 22, color: "#0c1e33", fontWeight: "bold" }
    ],
    renderPreview: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "#0c1e33");
      grad.addColorStop(1, "#16385f");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(h * 0.09)}px sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText("ضاعف مبيعاتك مع حلولنا", w * 0.08, h * 0.42);

      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.roundRect(w * 0.08, h * 0.58, w * 0.22, h * 0.12, 6);
      ctx.fill();
    }
  },

  // 5. E-Commerce Product Spotlight (1200x1200)
  {
    id: "ecom-premium-watch",
    nameAr: "بطاقة منتج فاخر لساعة أو عطر",
    nameEn: "Luxury Product Showcase",
    category: "ecommerce",
    width: 1200,
    height: 1200,
    aspect: "1:1",
    tags: ["product", "watch", "perfume", "ecommerce", "منتج"],
    layers: [
      { id: "bg", name: "خلفية ستوديو ناعمة", kind: "background", color: "#18181b" },
      { id: "title", name: "اسم الماركة", kind: "text", text: "CHRONO ELITE", x: 600, y: 220, fontSize: 46, color: "#a1a1aa" },
      { id: "price", name: "السعر الأصلي", kind: "text", text: "$499", x: 600, y: 1050, fontSize: 54, color: "#fbbf24", fontWeight: "bold" }
    ],
    renderPreview: (ctx, w, h) => {
      const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.6);
      grad.addColorStop(0, "#27272a");
      grad.addColorStop(1, "#09090b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#a1a1aa";
      ctx.font = `600 ${Math.round(h * 0.04)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("CHRONO ELITE", w / 2, h * 0.18);

      ctx.fillStyle = "#fbbf24";
      ctx.font = `bold ${Math.round(h * 0.05)}px sans-serif`;
      ctx.fillText("$499", w / 2, h * 0.88);
    }
  },

  // 6. Corporate Business Card (1050x600)
  {
    id: "biz-card-gold-black",
    nameAr: "بطاقة أعمال تنفيذية سوداء وذهبية",
    nameEn: "Executive Dark Gold Business Card",
    category: "business",
    width: 1050,
    height: 600,
    aspect: "1.75:1",
    tags: ["card", "business", "gold", "executive", "بطاقة"],
    layers: [
      { id: "bg", name: "الخلفية السوداء المات", kind: "background", color: "#121214" },
      { id: "name", name: "اسم الشخص", kind: "text", text: "المهندس سليمان العربي", x: 300, y: 260, fontSize: 36, color: "#ffffff", fontWeight: "bold" },
      { id: "role", name: "المسمى الوظيفي", kind: "text", text: "الرئيس التنفيذي والشريك المؤسس", x: 300, y: 310, fontSize: 20, color: "#f59e0b" },
      { id: "contact", name: "بيانات التواصل", kind: "text", text: "info@imagepro-studio.com | +966 50 123 4567", x: 300, y: 440, fontSize: 16, color: "#9ca3af" }
    ],
    renderPreview: (ctx, w, h) => {
      ctx.fillStyle = "#121214";
      ctx.fillRect(0, 0, w, h);

      // Gold line separator
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.58);
      ctx.lineTo(w * 0.45, h * 0.58);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(h * 0.08)}px sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText("المهندس سليمان العربي", w * 0.08, h * 0.42);

      ctx.fillStyle = "#f59e0b";
      ctx.font = `${Math.round(h * 0.045)}px sans-serif`;
      ctx.fillText("الرئيس التنفيذي والشريك المؤسس", w * 0.08, h * 0.52);
    }
  }
];
