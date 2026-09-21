/**
 * ImagePro Studio — Multi-Layer Editable Templates Studio
 * True layered designs (Background, Vector Shapes, Text/Headlines, Placeholders)
 */

export type TemplateCategory =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "presentations"
  | "business"
  | "marketing"
  | "education"
  | "cv"
  | "invitations"
  | "posters"
  | "flyers"
  | "ads"
  | "ecommerce";

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
  { id: "facebook", nameAr: "فيسبوك (منشور وغلاف)", nameEn: "Facebook Post & Cover", icon: "📘" },
  { id: "tiktok", nameAr: "تيك توك / ريلز (9:16)", nameEn: "TikTok & Stories", icon: "📱" },
  { id: "youtube", nameAr: "يوتيوب مصغرة وغلاف", nameEn: "YouTube Thumbnail", icon: "🎬" },
  { id: "linkedin", nameAr: "لينكد إن (غلاف ومنشور)", nameEn: "LinkedIn Post & Banner", icon: "💼" },
  { id: "presentations", nameAr: "عروض تقديمية (16:9)", nameEn: "Presentations", icon: "📊" },
  { id: "business", nameAr: "هوية وبطاقات أعمال", nameEn: "Business & Corporate", icon: "👔" },
  { id: "marketing", nameAr: "حملات تسويقية", nameEn: "Marketing & Growth", icon: "📈" },
  { id: "education", nameAr: "تعليم وشهادات ودورات", nameEn: "Education & Certificates", icon: "🎓" },
  { id: "cv", nameAr: "سيرة ذاتية احترافية", nameEn: "CV & Resumes", icon: "📄" },
  { id: "invitations", nameAr: "دعوات ومناسبات فاخرة", nameEn: "Invitations & Events", icon: "💌" },
  { id: "posters", nameAr: "بوسترات إعلانية", nameEn: "Posters & Wall Art", icon: "🖼️" },
  { id: "flyers", nameAr: "فلايرات ونشرات ترويجية", nameEn: "Flyers & Leaflets", icon: "📰" },
  { id: "ads", nameAr: "إعلانات رقمية", nameEn: "Digital Ads", icon: "🚀" },
  { id: "ecommerce", nameAr: "متجر إلكتروني وبانرات", nameEn: "E-Commerce", icon: "🛍️" },
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
  },

  // 7. Facebook Announcement Post (1200x630)
  {
    id: "fb-post-announcement",
    nameAr: "إعلان إطلاق رسمي وتحديثات فيسبوك",
    nameEn: "Facebook Official Launch Post",
    category: "facebook",
    width: 1200,
    height: 630,
    aspect: "1.91:1",
    tags: ["facebook", "launch", "announcement", "post", "فيسبوك", "إعلان"],
    layers: [
      { id: "bg", name: "الخلفية الكحلية العميقة", kind: "background", color: "#0c192c" },
      { id: "badge", name: "شارة الإعلان", kind: "shape", shapeType: "badge", x: 80, y: 80, width: 220, height: 50, color: "#3b82f6" },
      { id: "badge-txt", name: "نص الشارة", kind: "text", text: "إعلان هام 🚀", x: 190, y: 115, fontSize: 22, color: "#ffffff" },
      { id: "headline", name: "العنوان الرئيسي", kind: "text", text: "الجيل الجديد من منصة التصميم السحابية", x: 80, y: 260, fontSize: 48, color: "#ffffff", fontWeight: "bold" },
      { id: "desc", name: "التفاصيل", kind: "text", text: "أدوات ذكية متقدمة مع تحكم كامل بالطبقات والذكاء الاصطناعي", x: 80, y: 350, fontSize: 24, color: "#94a3b8" },
      { id: "cta-btn", name: "زر البدء", kind: "shape", shapeType: "rectangle", x: 80, y: 440, width: 220, height: 60, color: "#2dd4bf" },
      { id: "cta-txt", name: "نص الزر", kind: "text", text: "جرب الآن مجاناً", x: 190, y: 480, fontSize: 22, color: "#0f172a", fontWeight: "bold" }
    ],
    renderPreview: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#0c192c");
      grad.addColorStop(1, "#030712");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle cyan glow sphere
      const rad = ctx.createRadialGradient(w * 0.85, h * 0.5, 20, w * 0.85, h * 0.5, w * 0.4);
      rad.addColorStop(0, "rgba(59,130,246,0.35)");
      rad.addColorStop(1, "transparent");
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(h * 0.085)}px sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText("الجيل الجديد من منصة التصميم", w * 0.9, h * 0.45);

      ctx.fillStyle = "#94a3b8";
      ctx.font = `${Math.round(h * 0.045)}px sans-serif`;
      ctx.fillText("تحكم فائق بالطبقات والأدوات الذكية السحابية", w * 0.9, h * 0.6);

      // Button
      ctx.fillStyle = "#2dd4bf";
      ctx.beginPath();
      ctx.roundRect(w * 0.65, h * 0.72, w * 0.25, h * 0.12, 8);
      ctx.fill();
    }
  },

  // 8. LinkedIn Thought Leadership Banner (1584x396)
  {
    id: "linkedin-leadership-banner",
    nameAr: "غلاف لينكد إن تنفيذي وبصري",
    nameEn: "Executive LinkedIn Profile Banner",
    category: "linkedin",
    width: 1584,
    height: 396,
    aspect: "4:1",
    tags: ["linkedin", "banner", "career", "corporate", "لينكدإن", "غلاف"],
    layers: [
      { id: "bg", name: "الخلفية المتدرجة الزرقاء", kind: "background", color: "#0a2540" },
      { id: "title", name: "الرسالة المهنية", kind: "text", text: "Building the Future of Digital Creativity & AI", x: 400, y: 180, fontSize: 44, color: "#ffffff", fontWeight: "bold" },
      { id: "tags", name: "التخصصات", kind: "text", text: "Product Design • Artificial Intelligence • Creative Direction", x: 400, y: 250, fontSize: 24, color: "#38bdf8" }
    ],
    renderPreview: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "#0a2540");
      grad.addColorStop(0.6, "#0f172a");
      grad.addColorStop(1, "#0284c7");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Tech grid lines
      ctx.strokeStyle = "rgba(56,189,248,0.15)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(h * 0.14)}px sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText("Building the Future of Digital Creativity", w * 0.25, h * 0.48);

      ctx.fillStyle = "#38bdf8";
      ctx.font = `600 ${Math.round(h * 0.08)}px sans-serif`;
      ctx.fillText("Product Architecture • AI Visuals • Design Systems", w * 0.25, h * 0.72);
    }
  },

  // 9. Modern Keynote Presentation Slide (1920x1080)
  {
    id: "pres-keynote-tech",
    nameAr: "عرض تقديمي احترافي (Keynote 16:9)",
    nameEn: "Minimal Keynote Presentation Slide",
    category: "presentations",
    width: 1920,
    height: 1080,
    aspect: "16:9",
    tags: ["presentation", "keynote", "slide", "pitch", "عرض", "سلايد"],
    layers: [
      { id: "bg", name: "الخلفية الناعمة الفاتحة", kind: "background", color: "#f8fafc" },
      { id: "header-tag", name: "عنوان المحور", kind: "text", text: "01 / VISION & ARCHITECTURE", x: 160, y: 200, fontSize: 26, color: "#0284c7", fontWeight: "bold" },
      { id: "headline", name: "العنوان الرئيسي", kind: "text", text: "Transforming Pixels Into Precision Vector Assets", x: 160, y: 320, fontSize: 68, color: "#0f172a", fontWeight: "bold" },
      { id: "subtext", name: "الشرح التفصيلي", kind: "text", text: "Cloud-native graphics workstation built for next-generation visual creators and brand architects.", x: 160, y: 440, fontSize: 32, color: "#64748b" },
      { id: "stat-box", name: "صندوق الإحصائية", kind: "shape", shapeType: "rectangle", x: 160, y: 600, width: 380, height: 220, color: "#ffffff" },
      { id: "stat-num", name: "الرقم البارز", kind: "text", text: "10x", x: 200, y: 700, fontSize: 80, color: "#2563eb", fontWeight: "bold" },
      { id: "stat-lbl", name: "تسمية الرقم", kind: "text", text: "Faster Rendering Pipeline", x: 200, y: 760, fontSize: 24, color: "#475569" }
    ],
    renderPreview: (ctx, w, h) => {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#0284c7";
      ctx.font = `bold ${Math.round(h * 0.03)}px sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText("01 / STRATEGIC OVERVIEW", w * 0.08, h * 0.18);

      ctx.fillStyle = "#0f172a";
      ctx.font = `bold ${Math.round(h * 0.065)}px sans-serif`;
      ctx.fillText("Transforming Pixels Into Precision Assets", w * 0.08, h * 0.3);

      ctx.fillStyle = "#64748b";
      ctx.font = `${Math.round(h * 0.032)}px sans-serif`;
      ctx.fillText("Cloud-native graphics workstation built for next-generation visual teams.", w * 0.08, h * 0.4);

      // Card
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(w * 0.08, h * 0.52, w * 0.28, h * 0.25, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#2563eb";
      ctx.font = `bold ${Math.round(h * 0.08)}px sans-serif`;
      ctx.fillText("10x", w * 0.12, h * 0.65);

      ctx.fillStyle = "#64748b";
      ctx.font = `${Math.round(h * 0.025)}px sans-serif`;
      ctx.fillText("Faster Rendering Workflow", w * 0.12, h * 0.71);
    }
  },

  // 10. Marketing Campaign Flyer (2550x3300 - A4 High-Res)
  {
    id: "flyer-corporate-summit",
    nameAr: "فلاير مؤتمر تقني وتجاري سنوي",
    nameEn: "Global Tech Summit Commercial Flyer",
    category: "flyers",
    width: 2550,
    height: 3300,
    aspect: "3:4",
    tags: ["flyer", "conference", "business", "summit", "print", "فلاير", "مؤتمر"],
    layers: [
      { id: "bg", name: "الخلفية السوداء الرخامية", kind: "background", color: "#090d16" },
      { id: "header", name: "التاريخ والموقع", kind: "text", text: "OCTOBER 24-26 • DUBAI EXPO ARENA", x: 1275, y: 450, fontSize: 44, color: "#38bdf8", fontWeight: "bold" },
      { id: "title-1", name: "عنوان المؤتمر سطر 1", kind: "text", text: "GLOBAL TECH & AI", x: 1275, y: 700, fontSize: 130, color: "#ffffff", fontWeight: "bold" },
      { id: "title-2", name: "عنوان المؤتمر سطر 2", kind: "text", text: "SUMMIT 2026", x: 1275, y: 880, fontSize: 130, color: "#2dd4bf", fontWeight: "bold" },
      { id: "speaker-badge", name: "شارة المتحدثين", kind: "shape", shapeType: "badge", x: 775, y: 1300, width: 1000, height: 160, color: "#1e293b" },
      { id: "speaker-txt", name: "نص المتحدثين", kind: "text", text: "+50 المتحدثون العالميون • 40 دولة", x: 1275, y: 1400, fontSize: 52, color: "#f8fafc" },
      { id: "cta-btn", name: "زر التسجيل", kind: "shape", shapeType: "rectangle", x: 775, y: 2600, width: 1000, height: 200, color: "#0ea5e9" },
      { id: "cta-txt", name: "نص التسجيل", kind: "text", text: "احجز مقعدك المبكر الآن", x: 1275, y: 2720, fontSize: 62, color: "#ffffff", fontWeight: "bold" }
    ],
    renderPreview: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#090d16");
      grad.addColorStop(0.5, "#0f172a");
      grad.addColorStop(1, "#020617");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Cyan flare
      const flare = ctx.createRadialGradient(w / 2, h * 0.25, 20, w / 2, h * 0.25, w * 0.6);
      flare.addColorStop(0, "rgba(45,212,191,0.25)");
      flare.addColorStop(1, "transparent");
      ctx.fillStyle = flare;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#38bdf8";
      ctx.font = `bold ${Math.round(h * 0.022)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("OCTOBER 24-26 • DUBAI ARENA", w / 2, h * 0.14);

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(h * 0.05)}px sans-serif`;
      ctx.fillText("GLOBAL TECH SUMMIT", w / 2, h * 0.22);

      ctx.fillStyle = "#2dd4bf";
      ctx.fillText("2026 EDITION", w / 2, h * 0.28);

      // Button
      ctx.fillStyle = "#0ea5e9";
      ctx.beginPath();
      ctx.roundRect(w * 0.2, h * 0.8, w * 0.6, h * 0.08, 10);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(h * 0.028)}px sans-serif`;
      ctx.fillText("احجز مقعدك الآن", w / 2, h * 0.85);
    }
  },

  // 11. Luxury Gala Invitation Card (1500x2100)
  {
    id: "inv-luxury-gala",
    nameAr: "بطاقة دعوة حفل عشاء ملكي فاخر",
    nameEn: "Royal Gala Gold & Emerald Invitation",
    category: "invitations",
    width: 1500,
    height: 2100,
    aspect: "1:1.4",
    tags: ["invitation", "gala", "wedding", "gold", "luxury", "دعوة", "حفل", "زواج"],
    layers: [
      { id: "bg", name: "الخلفية الزمردية الداكنة", kind: "background", color: "#06281e" },
      { id: "border", name: "الإطار الذهبي الملكي", kind: "shape", shapeType: "rectangle", x: 70, y: 70, width: 1360, height: 1960, color: "rgba(234,179,8,0.7)" },
      { id: "host", name: "الجهة الداعية", kind: "text", text: "يتشرف مجلس الإدارة بدعوة سيادتكم", x: 750, y: 550, fontSize: 36, color: "#d1fae5" },
      { id: "event-name", name: "اسم الحفل", kind: "text", text: "حفل العشاء السنوي الكبير", x: 750, y: 750, fontSize: 64, color: "#fef08a", fontWeight: "bold" },
      { id: "date-loc", name: "الموعد والمكان", kind: "text", text: "الخميس، 15 ديسمبر • فندق الريتز كارلتون", x: 750, y: 920, fontSize: 32, color: "#ffffff" }
    ],
    renderPreview: (ctx, w, h) => {
      ctx.fillStyle = "#06281e";
      ctx.fillRect(0, 0, w, h);

      // Gold border
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 4;
      ctx.strokeRect(w * 0.07, h * 0.05, w * 0.86, h * 0.9);

      // Inner thin border
      ctx.lineWidth = 1;
      ctx.strokeRect(w * 0.09, h * 0.065, w * 0.82, h * 0.87);

      ctx.fillStyle = "#d1fae5";
      ctx.font = `${Math.round(h * 0.024)}px serif`;
      ctx.textAlign = "center";
      ctx.fillText("يتشرف مجلس الإدارة بدعوة سيادتكم", w / 2, h * 0.35);

      ctx.fillStyle = "#fef08a";
      ctx.font = `bold ${Math.round(h * 0.042)}px serif`;
      ctx.fillText("حفل العشاء السنوي الكبير", w / 2, h * 0.45);

      ctx.fillStyle = "#ffffff";
      ctx.font = `${Math.round(h * 0.022)}px sans-serif`;
      ctx.fillText("الخميس 15 ديسمبر • قصر المؤتمرات", w / 2, h * 0.55);
    }
  },

  // 12. Modern Designer CV / Resume (2480x3508 - A4)
  {
    id: "cv-modern-designer",
    nameAr: "سيرة ذاتية احترافية بتنسيق شبكي عصري",
    nameEn: "Modern Designer & Architect Resume",
    category: "cv",
    width: 2480,
    height: 3508,
    aspect: "1:1.41",
    tags: ["cv", "resume", "career", "job", "سيرة ذاتية", "توظيف"],
    layers: [
      { id: "bg", name: "الخلفية البيضاء النقية", kind: "background", color: "#ffffff" },
      { id: "sidebar", name: "الشريط الجانبي الرمادي", kind: "shape", shapeType: "rectangle", x: 0, y: 0, width: 850, height: 3508, color: "#0f172a" },
      { id: "name", name: "اسم المرشح", kind: "text", text: "سارة الأحمد", x: 1000, y: 400, fontSize: 80, color: "#0f172a", fontWeight: "bold" },
      { id: "title", name: "المسمى المهني", kind: "text", text: "Senior Product Designer & Art Director", x: 1000, y: 520, fontSize: 40, color: "#0284c7" }
    ],
    renderPreview: (ctx, w, h) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      // Dark sidebar
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, w * 0.32, h);

      // Content text
      ctx.fillStyle = "#0f172a";
      ctx.font = `bold ${Math.round(h * 0.038)}px sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText("سارة الأحمد", w * 0.38, h * 0.12);

      ctx.fillStyle = "#0284c7";
      ctx.font = `600 ${Math.round(h * 0.018)}px sans-serif`;
      ctx.fillText("Senior Product & Visual Designer", w * 0.38, h * 0.16);

      // Section lines
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.38, h * 0.22);
      ctx.lineTo(w * 0.9, h * 0.22);
      ctx.stroke();
    }
  },

  // 13. High-Impact Event Poster (2480x3508 - A4)
  {
    id: "poster-sound-wave-fest",
    nameAr: "بوستر فني وإعلاني للأفلام والفعاليات",
    nameEn: "Electric Horizon Cinema & Art Poster",
    category: "posters",
    width: 2480,
    height: 3508,
    aspect: "1:1.41",
    tags: ["poster", "art", "cinema", "music", "festival", "بوستر", "فعالية"],
    layers: [
      { id: "bg", name: "الخلفية السينمائية الداكنة", kind: "background", color: "#050508" },
      { id: "sun", name: "القرص المتوهج", kind: "shape", shapeType: "ellipse", x: 1240, y: 1500, width: 1200, height: 1200, color: "#f43f5e" },
      { id: "title", name: "عنوان العمل الفني", kind: "text", text: "NEON HORIZON", x: 1240, y: 800, fontSize: 120, color: "#ffffff", fontWeight: "bold" },
      { id: "sub", name: "الوصف", kind: "text", text: "AN AUDIO-VISUAL IMMERSIVE EXHIBITION", x: 1240, y: 980, fontSize: 40, color: "#fb7185" }
    ],
    renderPreview: (ctx, w, h) => {
      ctx.fillStyle = "#050508";
      ctx.fillRect(0, 0, w, h);

      // Neon circle
      const sun = ctx.createRadialGradient(w / 2, h * 0.5, 10, w / 2, h * 0.5, w * 0.4);
      sun.addColorStop(0, "#f43f5e");
      sun.addColorStop(0.7, "#fb7185");
      sun.addColorStop(1, "transparent");
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.5, w * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(h * 0.05)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("NEON HORIZON", w / 2, h * 0.22);

      ctx.fillStyle = "#fb7185";
      ctx.font = `600 ${Math.round(h * 0.018)}px sans-serif`;
      ctx.fillText("AUDIO-VISUAL IMMERSIVE EXHIBITION", w / 2, h * 0.27);
    }
  },

  // 14. Masterclass & Education Certificate (1920x1080)
  {
    id: "edu-course-masterclass",
    nameAr: "إعلان دورة تدريبية وماستر كلاس معتمد",
    nameEn: "Masterclass Course & Certificate Promo",
    category: "education",
    width: 1920,
    height: 1080,
    aspect: "16:9",
    tags: ["education", "course", "masterclass", "learning", "تعليم", "دورة"],
    layers: [
      { id: "bg", name: "الخلفية التعليمية الأنيقة", kind: "background", color: "#1e1b4b" },
      { id: "badge", name: "شارة الدورة", kind: "shape", shapeType: "badge", x: 160, y: 140, width: 280, height: 60, color: "#6366f1" },
      { id: "badge-txt", name: "نص الشارة", kind: "text", text: "شهادة معتمدة 🎓", x: 300, y: 180, fontSize: 26, color: "#ffffff" },
      { id: "title", name: "اسم الماستر كلاس", kind: "text", text: "ماستر كلاس التصميم الرقمي الاحترافي", x: 160, y: 360, fontSize: 60, color: "#ffffff", fontWeight: "bold" },
      { id: "instructor", name: "المدرب والجهة", kind: "text", text: "بإشراف نخبة من خبراء الصناعة العالميين", x: 160, y: 480, fontSize: 32, color: "#a5b4fc" }
    ],
    renderPreview: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#1e1b4b");
      grad.addColorStop(1, "#312e81");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#6366f1";
      ctx.beginPath();
      ctx.roundRect(w * 0.08, h * 0.12, w * 0.2, h * 0.08, 8);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(h * 0.05)}px sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText("ماستر كلاس التصميم الاحترافي", w * 0.08, h * 0.38);

      ctx.fillStyle = "#a5b4fc";
      ctx.font = `${Math.round(h * 0.03)}px sans-serif`;
      ctx.fillText("بإشراف نخبة من كبار الخبراء ومصممي المنتجات", w * 0.08, h * 0.5);
    }
  }
];
