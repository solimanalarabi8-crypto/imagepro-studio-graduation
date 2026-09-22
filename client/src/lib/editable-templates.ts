/**
 * ImagePro Studio — Multi-Layer Editable Templates Studio
 * True layered designs (Background, Vector Shapes, Text/Headlines, Placeholders)
 */

export type TemplateCategory =
  | "social"
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
  // ── Canva Suite Grade 1: Certificate of Authenticity & Recognition (A4 / 2000x1414) ──
  {
    id: "cert-authenticity-gold",
    nameAr: "شهادة أصالة وتوثيق فنية كلاسيكية مذهبة",
    nameEn: "Certificate of Authenticity & Fine Art",
    category: "education",
    width: 2000,
    height: 1414,
    aspect: "1.41:1",
    tags: ["certificate", "authenticity", "gold", "art", "شهادة", "توثيق", "أصالة"],
    layers: [
      { id: "bg-parchment", name: "خلفية الورق العاجي الفاخر", kind: "background", color: "#faf8f2" },
      { id: "frame-outer", name: "الإطار الخارجي الذهبي", kind: "shape", shapeType: "rectangle", x: 70, y: 70, width: 1860, height: 1274, color: "#d4af37" },
      { id: "frame-inner", name: "الإطار الداخلي الرفيع", kind: "shape", shapeType: "rectangle", x: 95, y: 95, width: 1810, height: 1224, color: "rgba(184,134,11,0.6)" },
      { id: "seal-ribbon", name: "شريطة الختم الملكي", kind: "shape", shapeType: "badge", x: 260, y: 1040, width: 160, height: 180, color: "#b8860b" },
      { id: "title-main", name: "عنوان الشهادة", kind: "text", text: "CERTIFICATE OF AUTHENTICITY", x: 1000, y: 220, fontSize: 56, color: "#2d2a26", fontWeight: "bold" },
      { id: "subtitle", name: "العنوان الفرعي", kind: "text", text: "of Original Artwork & Archival Master", x: 1000, y: 290, fontSize: 34, color: "#786d5e", fontWeight: "normal" },
      { id: "recipient", name: "اسم المستلم / الفنان", kind: "text", text: "Presented to: Olivia Wilson", x: 1000, y: 390, fontSize: 44, color: "#1f2937", fontWeight: "bold" },
      { id: "meta-title", name: "بيانات العمل: العنوان", kind: "text", text: "Title of the Artwork: Serenade of Twilight", x: 1000, y: 550, fontSize: 26, color: "#4b5563" },
      { id: "meta-artist", name: "بيانات العمل: الفنان", kind: "text", text: "Artist's Name: Elena Rostova", x: 1000, y: 620, fontSize: 26, color: "#4b5563" },
      { id: "meta-medium", name: "بيانات العمل: الخامة", kind: "text", text: "Medium / Materials: Oil on Canvas & 24K Gold Leaf", x: 1000, y: 690, fontSize: 26, color: "#4b5563" },
      { id: "meta-dims", name: "بيانات العمل: الأبعاد", kind: "text", text: "Dimensions: 120 × 90 cm (Archival Edition 1/1)", x: 1000, y: 760, fontSize: 26, color: "#4b5563" },
      { id: "sig-author", name: "توقيع المعتمد", kind: "text", text: "Authorized Curator Signature", x: 1400, y: 1140, fontSize: 22, color: "#6b7280" }
    ],
    renderPreview: (ctx, w, h) => {
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.1, w / 2, h / 2, w * 0.7);
      bgGrad.addColorStop(0, "#ffffff");
      bgGrad.addColorStop(0.7, "#faf6ed");
      bgGrad.addColorStop(1, "#f3eedd");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "#c59f42";
      ctx.lineWidth = Math.max(2, w * 0.005);
      ctx.strokeRect(w * 0.045, h * 0.045, w * 0.91, h * 0.91);

      ctx.strokeStyle = "rgba(197, 159, 66, 0.4)";
      ctx.lineWidth = Math.max(1, w * 0.002);
      ctx.strokeRect(w * 0.055, h * 0.055, w * 0.89, h * 0.89);

      const drawCorner = (cx: number, cy: number, flipX: number, flipY: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(flipX, flipY);
        ctx.strokeStyle = "#b3882f";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, w * 0.035, 0, Math.PI / 2);
        ctx.moveTo(w * 0.015, w * 0.015);
        ctx.lineTo(w * 0.035, w * 0.035);
        ctx.stroke();
        ctx.restore();
      };
      drawCorner(w * 0.055, h * 0.055, 1, 1);
      drawCorner(w * 0.945, h * 0.055, -1, 1);
      drawCorner(w * 0.055, h * 0.945, 1, -1);
      drawCorner(w * 0.945, h * 0.945, -1, -1);

      ctx.fillStyle = "#2c2722";
      ctx.font = `bold ${Math.round(h * 0.055)}px "Times New Roman", serif`;
      ctx.textAlign = "center";
      ctx.fillText("CERTIFICATE", w / 2, h * 0.16);
      ctx.font = `italic 400 ${Math.round(h * 0.038)}px "Times New Roman", serif`;
      ctx.fillText("of Authenticity", w / 2, h * 0.22);

      ctx.fillStyle = "#8a7b6b";
      ctx.font = `300 ${Math.round(h * 0.022)}px sans-serif`;
      ctx.fillText("THIS CERTIFIES THAT THE PIECE DESCRIBED IS AN ORIGINAL ARCHIVAL WORK", w / 2, h * 0.27);

      const thumbW = w * 0.22;
      const thumbH = h * 0.38;
      const thumbX = w * 0.1;
      const thumbY = h * 0.35;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(thumbX, thumbY, thumbW, thumbH);
      ctx.strokeStyle = "#c59f42";
      ctx.lineWidth = 1;
      ctx.strokeRect(thumbX, thumbY, thumbW, thumbH);

      const artGrad = ctx.createLinearGradient(thumbX, thumbY, thumbX, thumbY + thumbH);
      artGrad.addColorStop(0, "#d8b4e2");
      artGrad.addColorStop(0.4, "#fcd34d");
      artGrad.addColorStop(0.7, "#38bdf8");
      artGrad.addColorStop(1, "#1e3a8a");
      ctx.fillStyle = artGrad;
      ctx.fillRect(thumbX + 4, thumbY + 4, thumbW - 8, thumbH - 8);

      ctx.textAlign = "left";
      const startX = w * 0.38;
      const fields = [
        ["Title of the Artwork:", "Serenade of Twilight"],
        ["Artist's Name:", "Olivia Wilson"],
        ["Medium/Materials:", "Oil on Linen & 24K Gold Leaf"],
        ["Dimensions:", "120 × 90 cm"],
        ["Date of Creation:", "September 2026"]
      ];
      fields.forEach(([lbl, val], idx) => {
        const rowY = h * 0.36 + idx * (h * 0.075);
        ctx.fillStyle = "#4a4238";
        ctx.font = `bold ${Math.round(h * 0.024)}px sans-serif`;
        ctx.fillText(lbl, startX, rowY);
        ctx.fillStyle = "#1e293b";
        ctx.font = `${Math.round(h * 0.024)}px sans-serif`;
        ctx.fillText(val, startX + w * 0.24, rowY);
        ctx.strokeStyle = "rgba(197, 159, 66, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX, rowY + 6);
        ctx.lineTo(w * 0.88, rowY + 6);
        ctx.stroke();
      });

      const sealX = w * 0.21;
      const sealY = h * 0.84;
      const sealR = h * 0.08;
      const sealGrad = ctx.createRadialGradient(sealX, sealY, 5, sealX, sealY, sealR);
      sealGrad.addColorStop(0, "#fde68a");
      sealGrad.addColorStop(0.5, "#d97706");
      sealGrad.addColorStop(1, "#92400e");
      ctx.fillStyle = sealGrad;
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fef08a";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(h * 0.02)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("OFFICIAL", sealX, sealY - 4);
      ctx.fillText("SEAL", sealX, sealY + 12);

      const sigX = w * 0.65;
      const sigY = h * 0.84;
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sigX, sigY);
      ctx.lineTo(sigX + w * 0.22, sigY);
      ctx.stroke();

      ctx.fillStyle = "#1e293b";
      ctx.font = `italic ${Math.round(h * 0.035)}px "Brush Script MT", cursive, sans-serif`;
      ctx.fillText("Olivia Wilson", sigX + w * 0.11, sigY - 8);

      ctx.fillStyle = "#64748b";
      ctx.font = `${Math.round(h * 0.018)}px sans-serif`;
      ctx.fillText("Artist's Signature", sigX + w * 0.11, sigY + 18);
    }
  },

  // ── Canva Suite Grade 2: Executive Modern Resume (Olivia Sanchez) ──
  {
    id: "cv-olivia-executive",
    nameAr: "سيرة ذاتية تنفيذية عصرية ومنظمة (Canva Style)",
    nameEn: "Executive Modern Resume & Portfolio",
    category: "cv",
    width: 1240,
    height: 1754,
    aspect: "1:1.41",
    tags: ["cv", "resume", "executive", "portfolio", "سيرة ذاتية", "توظيف"],
    layers: [
      { id: "bg-white", name: "الخلفية البيضاء النقية", kind: "background", color: "#ffffff" },
      { id: "header-strip", name: "شريط الرأس الرمادي الناعم", kind: "shape", shapeType: "rectangle", x: 0, y: 0, width: 1240, height: 260, color: "#f8fafc" },
      { id: "divider-line", name: "خط التقسيم الرأسي", kind: "shape", shapeType: "rectangle", x: 420, y: 300, width: 2, height: 1380, color: "#e2e8f0" },
      { id: "name-main", name: "اسم المرشح", kind: "text", text: "OLIVIA SANCHEZ", x: 620, y: 110, fontSize: 62, color: "#0f172a", fontWeight: "bold" },
      { id: "title-role", name: "المسمى الوظيفي", kind: "text", text: "ADMINISTRATIVE & OPERATIONS MANAGER", x: 620, y: 170, fontSize: 26, color: "#0284c7", fontWeight: "bold" },
      { id: "contact-strip", name: "بيانات التواصل", kind: "text", text: "olivia.sanchez@email.com • +1 (555) 234-5678 • New York, NY", x: 620, y: 220, fontSize: 20, color: "#64748b" },
      { id: "summary-head", name: "عنوان النبذة", kind: "text", text: "EXECUTIVE SUMMARY", x: 100, y: 340, fontSize: 24, color: "#0f172a", fontWeight: "bold" },
      { id: "summary-body", name: "نص النبذة المهنية", kind: "text", text: "Results-driven manager with 8+ years leading cross-functional teams in high-growth enterprises.", x: 100, y: 390, fontSize: 18, color: "#475569" },
      { id: "exp-head", name: "عنوان الخبرات", kind: "text", text: "WORK EXPERIENCE", x: 460, y: 340, fontSize: 24, color: "#0f172a", fontWeight: "bold" }
    ],
    renderPreview: (ctx, w, h) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, w, h * 0.16);

      ctx.fillStyle = "#0f172a";
      ctx.font = `bold ${Math.round(h * 0.038)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("OLIVIA SANCHEZ", w / 2, h * 0.065);

      ctx.fillStyle = "#0284c7";
      ctx.font = `bold ${Math.round(h * 0.016)}px sans-serif`;
      ctx.fillText("ADMINISTRATIVE & OPERATIONS MANAGER", w / 2, h * 0.098);

      ctx.fillStyle = "#64748b";
      ctx.font = `${Math.round(h * 0.013)}px sans-serif`;
      ctx.fillText("olivia.sanchez@email.com   •   +1 (555) 234-5678   •   New York, NY", w / 2, h * 0.128);

      const colX = w * 0.35;
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(colX, h * 0.18);
      ctx.lineTo(colX, h * 0.95);
      ctx.stroke();

      ctx.textAlign = "left";
      let ly = h * 0.2;

      ctx.fillStyle = "#0f172a";
      ctx.font = `bold ${Math.round(h * 0.016)}px sans-serif`;
      ctx.fillText("SUMMARY", w * 0.06, ly);
      ly += h * 0.025;
      ctx.fillStyle = "#475569";
      ctx.font = `${Math.round(h * 0.012)}px sans-serif`;
      ctx.fillText("Detail-oriented executive manager with", w * 0.06, ly);
      ly += h * 0.02;
      ctx.fillText("8+ years experience in enterprise systems,", w * 0.06, ly);
      ly += h * 0.02;
      ctx.fillText("cross-department workflows, and strategy.", w * 0.06, ly);

      ly += h * 0.05;
      ctx.fillStyle = "#0f172a";
      ctx.font = `bold ${Math.round(h * 0.016)}px sans-serif`;
      ctx.fillText("CORE COMPETENCIES", w * 0.06, ly);
      ly += h * 0.025;

      const skills = ["Strategic Planning", "Project Management", "Financial Reporting", "Team Leadership", "Data Analytics"];
      skills.forEach((sk) => {
        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.arc(w * 0.075, ly - 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#334155";
        ctx.font = `${Math.round(h * 0.012)}px sans-serif`;
        ctx.fillText(sk, w * 0.095, ly);
        ly += h * 0.028;
      });

      let ry = h * 0.2;
      ctx.fillStyle = "#0f172a";
      ctx.font = `bold ${Math.round(h * 0.018)}px sans-serif`;
      ctx.fillText("PROFESSIONAL EXPERIENCE", colX + w * 0.04, ry);
      ry += h * 0.035;

      const jobs = [
        { role: "Senior Operations Director", company: "Aegis Global Enterprises", period: "2021 — PRESENT", bullet: "Managed operational workflows across 14 global offices with 22% ROI uplift." },
        { role: "Administrative Lead", company: "Apex Creative Agency", period: "2018 — 2021", bullet: "Streamlined resource allocation and implemented digital asset collaboration pipelines." },
        { role: "Operations Coordinator", company: "Vanguard Media Group", period: "2015 — 2018", bullet: "Coordinated cross-functional communications and managed client delivery timelines." }
      ];

      jobs.forEach((job) => {
        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.arc(colX + w * 0.04, ry - 4, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#0f172a";
        ctx.font = `bold ${Math.round(h * 0.015)}px sans-serif`;
        ctx.fillText(job.role, colX + w * 0.06, ry);

        ctx.fillStyle = "#0284c7";
        ctx.font = `bold ${Math.round(h * 0.011)}px sans-serif`;
        ctx.fillText(job.period, colX + w * 0.42, ry);
        ry += h * 0.022;

        ctx.fillStyle = "#64748b";
        ctx.font = `italic ${Math.round(h * 0.012)}px sans-serif`;
        ctx.fillText(job.company, colX + w * 0.06, ry);
        ry += h * 0.025;

        ctx.fillStyle = "#475569";
        ctx.font = `${Math.round(h * 0.012)}px sans-serif`;
        ctx.fillText(job.bullet, colX + w * 0.06, ry);
        ry += h * 0.05;
      });
    }
  },

  // ── Canva Suite Grade 3: Split Face Editorial Art ("ABOUT" Portrait) ──
  {
    id: "poster-editorial-split",
    nameAr: "بوستر فوتوغرافي مقسوم وفن تحريري (Canva Editorial)",
    nameEn: "Split Face Editorial Art Poster",
    category: "posters",
    width: 1080,
    height: 1350,
    aspect: "4:5",
    tags: ["poster", "editorial", "fashion", "split", "بوستر", "فوتوغرافي", "أزياء"],
    layers: [
      { id: "bg-dark", name: "الخلفية الداكنة الفاخرة", kind: "background", color: "#0c0a09" },
      { id: "split-line", name: "خط الفصل العمودي", kind: "shape", shapeType: "rectangle", x: 539, y: 0, width: 2, height: 1350, color: "rgba(255,255,255,0.2)" },
      { id: "brand-title", name: "العنوان الرئيسي", kind: "text", text: "A  B  O  U  T", x: 540, y: 650, fontSize: 68, color: "#ffffff", fontWeight: "bold" },
      { id: "sub-editorial", name: "الوصف التحريري", kind: "text", text: "A NEW PERSPECTIVE ON HUMAN ESSENCE", x: 540, y: 720, fontSize: 22, color: "rgba(255,255,255,0.7)" },
      { id: "footer-credits", name: "حقوق المعرض", kind: "text", text: "PARIS FASHION WEEK • ARCHIVE EDITION 2026", x: 540, y: 1260, fontSize: 18, color: "rgba(255,255,255,0.5)" }
    ],
    renderPreview: (ctx, w, h) => {
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(0, 0, w / 2, h);

      const eyeGrad = ctx.createRadialGradient(w * 0.28, h * 0.45, 10, w * 0.28, h * 0.45, w * 0.25);
      eyeGrad.addColorStop(0, "#e7e5e4");
      eyeGrad.addColorStop(0.3, "#78716c");
      eyeGrad.addColorStop(0.7, "#292524");
      eyeGrad.addColorStop(1, "#1c1917");
      ctx.fillStyle = eyeGrad;
      ctx.beginPath();
      ctx.ellipse(w * 0.28, h * 0.45, w * 0.2, h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      const rightGrad = ctx.createLinearGradient(w / 2, 0, w, h);
      rightGrad.addColorStop(0, "#f5ebe0");
      rightGrad.addColorStop(0.6, "#e3d5ca");
      rightGrad.addColorStop(1, "#d5bdaf");
      ctx.fillStyle = rightGrad;
      ctx.fillRect(w / 2, 0, w / 2, h);

      const faceGrad = ctx.createRadialGradient(w * 0.72, h * 0.45, 20, w * 0.72, h * 0.45, w * 0.25);
      faceGrad.addColorStop(0, "#ffffff");
      faceGrad.addColorStop(0.5, "#eddcd2");
      faceGrad.addColorStop(1, "#cb997e");
      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.ellipse(w * 0.72, h * 0.45, w * 0.2, h * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(h * 0.045)}px "Didot", serif, sans-serif`;
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 10;
      ctx.fillText("A   B   O   U   T", w / 2, h * 0.52);

      ctx.shadowBlur = 0;
      ctx.font = `300 ${Math.round(h * 0.015)}px sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText("A NEW PERSPECTIVE ON HUMAN ESSENCE", w / 2, h * 0.56);

      ctx.font = `600 ${Math.round(h * 0.013)}px sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText("VOLUME N° 04", w * 0.15, h * 0.08);

      ctx.fillText("PARIS EDITORIAL ARCHIVE   •   EST. 2026", w / 2, h * 0.94);
    }
  },

  // ── Canva Suite Grade 4: Street Photography with Camera UI Overlay ──
  {
    id: "social-camera-viewfinder",
    nameAr: "تصوير لايف ستايل ستريت مع واجهة الكاميرا الحية",
    nameEn: "Street Photography & Camera HUD Overlay",
    category: "instagram",
    width: 1080,
    height: 1080,
    aspect: "1:1",
    tags: ["camera", "street", "photography", "lifestyle", "hud", "تصوير", "كاميرا"],
    layers: [
      { id: "bg-photo", name: "صورة الشارع واللايف ستايل", kind: "background", color: "#3e322b" },
      { id: "focus-bracket", name: "قوس التركيز البؤري الأصفر", kind: "shape", shapeType: "rectangle", x: 440, y: 440, width: 200, height: 200, color: "#eab308" },
      { id: "shutter-btn", name: "زر التصوير الدائري", kind: "shape", shapeType: "ellipse", x: 500, y: 920, width: 80, height: 80, color: "#ffffff" },
      { id: "mode-photo", name: "وضع التصوير النشط", kind: "text", text: "PHOTO", x: 540, y: 880, fontSize: 24, color: "#eab308", fontWeight: "bold" },
      { id: "mode-video", name: "وضع الفيديو", kind: "text", text: "VIDEO", x: 410, y: 880, fontSize: 20, color: "#ffffff" },
      { id: "mode-slomo", name: "وضع الحركة البطيئة", kind: "text", text: "SLO-MO", x: 280, y: 880, fontSize: 20, color: "#94a3b8" },
      { id: "mode-square", name: "وضع المربع", kind: "text", text: "SQUARE", x: 670, y: 880, fontSize: 20, color: "#ffffff" },
      { id: "hud-info", name: "بيانات العدسة", kind: "text", text: "4K • 60 FPS • RAW", x: 540, y: 80, fontSize: 22, color: "#ffffff" }
    ],
    renderPreview: (ctx, w, h) => {
      const groundGrad = ctx.createRadialGradient(w / 2, h * 0.5, 40, w / 2, h * 0.5, w * 0.7);
      groundGrad.addColorStop(0, "#7c5e47");
      groundGrad.addColorStop(0.5, "#4a3b32");
      groundGrad.addColorStop(1, "#261e19");
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, 0, w, h);

      const shoeY = h * 0.48;
      ctx.fillStyle = "#8a4f26";
      ctx.beginPath();
      ctx.ellipse(w * 0.5, shoeY, w * 0.22, h * 0.24, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(w * 0.46, shoeY - h * 0.16, w * 0.1, h * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();

      const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.35, w / 2, h / 2, w * 0.65);
      vig.addColorStop(0, "transparent");
      vig.addColorStop(1, "rgba(0, 0, 0, 0.65)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#ffffff";
      ctx.font = `600 ${Math.round(h * 0.022)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("4K • 60 FPS", w / 2, h * 0.08);

      ctx.textAlign = "left";
      ctx.fillText("⚡ AUTO", w * 0.08, h * 0.08);
      ctx.textAlign = "right";
      ctx.fillText("RAW", w * 0.92, h * 0.08);

      const rw = w * 0.18;
      const rh = h * 0.18;
      const rx = (w - rw) / 2;
      const ry = (h - rh) / 2;
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 2;
      const cornerLen = 14;

      ctx.beginPath();
      ctx.moveTo(rx, ry + cornerLen); ctx.lineTo(rx, ry); ctx.lineTo(rx + cornerLen, ry);
      ctx.moveTo(rx + rw - cornerLen, ry); ctx.lineTo(rx + rw, ry); ctx.lineTo(rx + rw, ry + cornerLen);
      ctx.moveTo(rx, ry + rh - cornerLen); ctx.lineTo(rx, ry + rh); ctx.lineTo(rx + cornerLen, ry + rh);
      ctx.moveTo(rx + rw - cornerLen, ry + rh); ctx.lineTo(rx + rw, ry + rh); ctx.lineTo(rx + rw, ry + rh - cornerLen);
      ctx.stroke();

      const modeY = h * 0.84;
      ctx.textAlign = "center";
      ctx.font = `${Math.round(h * 0.02)}px sans-serif`;

      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.fillText("SLO-MO", w * 0.18, modeY);
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.fillText("VIDEO", w * 0.36, modeY);

      ctx.fillStyle = "#eab308";
      ctx.font = `bold ${Math.round(h * 0.022)}px sans-serif`;
      ctx.fillText("PHOTO", w * 0.5, modeY);

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `${Math.round(h * 0.02)}px sans-serif`;
      ctx.fillText("SQUARE", w * 0.65, modeY);
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.fillText("PANO", w * 0.82, modeY);

      const shutX = w / 2;
      const shutY = h * 0.92;
      const shutR = h * 0.055;

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(shutX, shutY, shutR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(shutX, shutY, shutR * 0.82, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // ── Canva Suite Grade 5: Interior Design Pitch Deck (Modern Minimal) ──
  {
    id: "pres-interior-pitchdeck",
    nameAr: "غلاف عرض تقديمي معماري داخلي فاخر (Pitch Deck)",
    nameEn: "Interior Design Luxury Pitch Deck",
    category: "presentations",
    width: 1920,
    height: 1080,
    aspect: "16:9",
    tags: ["presentation", "pitchdeck", "architecture", "interior", "عرض تقديمي", "معمار"],
    layers: [
      { id: "bg-olive", name: "الخلفية الزيتية الترابية الفاخرة", kind: "background", color: "#36362e" },
      { id: "divider-line", name: "خط المنتصف لغلاف العرض", kind: "shape", shapeType: "rectangle", x: 959, y: 0, width: 2, height: 1080, color: "rgba(255,255,255,0.15)" },
      { id: "photo-frame", name: "إطار الفتحة المعمارية", kind: "shape", shapeType: "rectangle", x: 1040, y: 120, width: 780, height: 840, color: "#45453b" },
      { id: "tag-brand", name: "تصنيف التصميم", kind: "text", text: "Modern Minimal", x: 240, y: 460, fontSize: 32, color: "#d6d3d1" },
      { id: "headline-main", name: "عنوان العرض التقديمي", kind: "text", text: "Interior Design\nPitch Deck", x: 240, y: 550, fontSize: 84, color: "#ffffff", fontWeight: "bold" },
      { id: "studio-brand", name: "شعار الاستوديو المعماري", kind: "text", text: "LUMINA ARCHITECTS & PARTNERS • 2026", x: 240, y: 920, fontSize: 24, color: "#a8a29e" }
    ],
    renderPreview: (ctx, w, h) => {
      ctx.fillStyle = "#36362e";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();

      const archX = w * 0.54;
      const archY = h * 0.12;
      const archW = w * 0.41;
      const archH = h * 0.76;

      const archGrad = ctx.createLinearGradient(archX, archY, archX + archW, archY + archH);
      archGrad.addColorStop(0, "#cbd5e1");
      archGrad.addColorStop(0.3, "#94a3b8");
      archGrad.addColorStop(0.65, "#52525b");
      archGrad.addColorStop(1, "#27272a");
      ctx.fillStyle = archGrad;
      ctx.fillRect(archX, archY, archW, archH);

      const sunBeam = ctx.createLinearGradient(archX + archW * 0.2, archY, archX + archW * 0.8, archY + archH);
      sunBeam.addColorStop(0, "rgba(254, 243, 199, 0.35)");
      sunBeam.addColorStop(1, "transparent");
      ctx.fillStyle = sunBeam;
      ctx.fillRect(archX, archY, archW, archH);

      ctx.textAlign = "left";
      ctx.fillStyle = "#d6d3d1";
      ctx.font = `300 ${Math.round(h * 0.03)}px "Times New Roman", serif`;
      ctx.fillText("Modern Minimal", w * 0.08, h * 0.44);

      ctx.fillStyle = "#ffffff";
      ctx.font = `400 ${Math.round(h * 0.08)}px "Times New Roman", serif`;
      ctx.fillText("Interior Design", w * 0.08, h * 0.54);
      ctx.fillText("Pitch Deck", w * 0.08, h * 0.64);

      ctx.fillStyle = "#a8a29e";
      ctx.font = `300 ${Math.round(h * 0.02)}px sans-serif`;
      ctx.fillText("LUMINA ARCHITECTS & PARTNERS   •   2026", w * 0.08, h * 0.9);

      ctx.fillText("2026", w * 0.08, h * 0.12);
    }
  },

  // ── Canva Suite Grade 6: Royal Emerald & Gold Gala Invitation ──
  {
    id: "inv-royal-wedding",
    nameAr: "دعوة زفاف ومناسبات ملكية فاخرة بالذهب والزمرد",
    nameEn: "Royal Emerald & Gold Luxury Gala Invitation",
    category: "invitations",
    width: 1080,
    height: 1920,
    aspect: "9:16",
    tags: ["invitation", "wedding", "gold", "emerald", "luxury", "دعوة", "زفاف", "ملكي"],
    layers: [
      { id: "bg-emerald", name: "الخلفية الزمردية المخملية", kind: "background", color: "#031c15" },
      { id: "gold-border", name: "الإطار الذهبي الملكي", kind: "shape", shapeType: "rectangle", x: 60, y: 60, width: 960, height: 1800, color: "#eab308" },
      { id: "header-greeting", name: "التحية الترحيبية", kind: "text", text: "TOGETHER WITH THEIR FAMILIES", x: 540, y: 440, fontSize: 28, color: "#d1fae5" },
      { id: "names-couple", name: "أسماء العروسين / الحفل", kind: "text", text: "Victoria & Alexander", x: 540, y: 580, fontSize: 72, color: "#fef08a", fontWeight: "bold" },
      { id: "invitation-text", name: "نص الدعوة", kind: "text", text: "REQUEST THE HONOR OF YOUR PRESENCE", x: 540, y: 700, fontSize: 26, color: "#a7f3d0" },
      { id: "date-details", name: "الموعد والمكان", kind: "text", text: "SATURDAY, DECEMBER 12TH, 2026\nAT SEVEN O'CLOCK IN THE EVENING", x: 540, y: 840, fontSize: 32, color: "#ffffff" },
      { id: "venue-name", name: "اسم القاعة الفاخرة", kind: "text", text: "THE GRAND IMPERIAL PALACE • DUBAI", x: 540, y: 1020, fontSize: 28, color: "#fef08a" }
    ],
    renderPreview: (ctx, w, h) => {
      const emGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.1, w / 2, h / 2, h * 0.6);
      emGrad.addColorStop(0, "#06372b");
      emGrad.addColorStop(0.7, "#032018");
      emGrad.addColorStop(1, "#01120d");
      ctx.fillStyle = emGrad;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 40; i++) {
        const px = (Math.sin(i * 99) * 0.5 + 0.5) * w;
        const py = (Math.cos(i * 37) * 0.5 + 0.5) * h;
        const pr = Math.abs(Math.sin(i * 13)) * 2.5 + 0.5;
        ctx.fillStyle = i % 2 === 0 ? "rgba(254, 240, 138, 0.6)" : "rgba(234, 179, 8, 0.4)";
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.07, h * 0.04, w * 0.86, h * 0.92);

      ctx.strokeStyle = "rgba(234, 179, 8, 0.35)";
      ctx.lineWidth = 1;
      ctx.strokeRect(w * 0.085, h * 0.05, w * 0.83, h * 0.9);

      ctx.textAlign = "center";
      ctx.fillStyle = "#d1fae5";
      ctx.font = `300 ${Math.round(h * 0.016)}px sans-serif`;
      ctx.fillText("TOGETHER WITH THEIR FAMILIES", w / 2, h * 0.24);

      ctx.fillStyle = "#fef08a";
      ctx.font = `italic ${Math.round(h * 0.046)}px "Brush Script MT", "Times New Roman", cursive`;
      ctx.fillText("Victoria & Alexander", w / 2, h * 0.32);

      ctx.fillStyle = "#a7f3d0";
      ctx.font = `300 ${Math.round(h * 0.015)}px sans-serif`;
      ctx.fillText("INVITE YOU TO CELEBRATE THEIR WEDDING", w / 2, h * 0.4);

      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.35, h * 0.46);
      ctx.lineTo(w * 0.65, h * 0.46);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(h * 0.02)}px sans-serif`;
      ctx.fillText("SATURDAY • DEC 12 • 2026", w / 2, h * 0.52);

      ctx.fillStyle = "#d1fae5";
      ctx.font = `300 ${Math.round(h * 0.016)}px sans-serif`;
      ctx.fillText("AT SEVEN O'CLOCK IN THE EVENING", w / 2, h * 0.56);

      ctx.fillStyle = "#fef08a";
      ctx.font = `bold ${Math.round(h * 0.018)}px sans-serif`;
      ctx.fillText("THE GRAND IMPERIAL PALACE", w / 2, h * 0.64);
      ctx.fillStyle = "rgba(209, 250, 229, 0.7)";
      ctx.font = `${Math.round(h * 0.014)}px sans-serif`;
      ctx.fillText("RECEPTION TO FOLLOW", w / 2, h * 0.7);
    }
  },

  // ── Canva Suite Grade 7: Instagram Fashion Promo with 3D Glossy Badge ──
  {
    id: "insta-fashion-pastel",
    nameAr: "منشور إنستغرام للأزياء والموضة مع شارة خصم ثلاثية الأبعاد",
    nameEn: "Pastel Fashion Sale with 3D Badge",
    category: "instagram",
    width: 1080,
    height: 1080,
    aspect: "1:1",
    tags: ["fashion", "sale", "instagram", "pastel", "3d", "أزياء", "تخفيضات"],
    layers: [
      { id: "bg-pastel", name: "الخلفية الباستيل الوردية", kind: "background", color: "#fce7f3" },
      { id: "badge-3d", name: "شارة الخصم الثلاثية الأبعاد", kind: "shape", shapeType: "badge", x: 120, y: 120, width: 220, height: 80, color: "#ec4899" },
      { id: "badge-txt", name: "نص الخصم", kind: "text", text: "50% OFF", x: 230, y: 175, fontSize: 36, color: "#ffffff", fontWeight: "bold" },
      { id: "title-main", name: "العنوان الرئيسي", kind: "text", text: "SUMMER\nCOLLECTION", x: 540, y: 820, fontSize: 62, color: "#1e1b4b", fontWeight: "bold" },
      { id: "cta-pill", name: "زر التسوق", kind: "shape", shapeType: "rectangle", x: 415, y: 920, width: 250, height: 60, color: "#0f172a" },
      { id: "cta-txt", name: "نص زر التسوق", kind: "text", text: "SHOP NOW →", x: 540, y: 960, fontSize: 24, color: "#ffffff", fontWeight: "bold" }
    ],
    renderPreview: (ctx, w, h) => {
      const pGrad = ctx.createLinearGradient(0, 0, w, h);
      pGrad.addColorStop(0, "#fee2e2");
      pGrad.addColorStop(0.5, "#fce7f3");
      pGrad.addColorStop(1, "#f3e8ff");
      ctx.fillStyle = pGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "rgba(244, 114, 182, 0.15)";
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.45, w * 0.38, h * 0.38, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.shadowColor = "rgba(15, 23, 42, 0.2)";
      ctx.shadowBlur = 25;
      ctx.shadowOffsetY = 15;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(w * 0.25, h * 0.2, w * 0.5, h * 0.55, 24);
      ctx.fill();
      ctx.restore();

      const innerGrad = ctx.createLinearGradient(w * 0.25, h * 0.2, w * 0.75, h * 0.75);
      innerGrad.addColorStop(0, "#fda4af");
      innerGrad.addColorStop(1, "#c084fc");
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.roundRect(w * 0.27, h * 0.22, w * 0.46, h * 0.51, 18);
      ctx.fill();

      ctx.save();
      ctx.shadowColor = "rgba(236, 72, 153, 0.45)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = "#ec4899";
      ctx.beginPath();
      ctx.roundRect(w * 0.12, h * 0.12, w * 0.26, h * 0.08, 12);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(h * 0.038)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("50% OFF", w * 0.25, h * 0.175);

      ctx.fillStyle = "#1e1b4b";
      ctx.font = `bold ${Math.round(h * 0.055)}px sans-serif`;
      ctx.fillText("SUMMER ESSENTIALS", w / 2, h * 0.84);

      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(w * 0.35, h * 0.88, w * 0.3, h * 0.065, 30);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(h * 0.022)}px sans-serif`;
      ctx.fillText("SHOP NOW →", w / 2, h * 0.922);
    }
  },

  // ── Canva Suite Grade 8: Modern Tech Newsletter (Email Design) ──
  {
    id: "email-tech-newsletter",
    nameAr: "تصميم بريد إلكتروني ونشرة تقنية حديثة",
    nameEn: "Modern Tech Email Newsletter",
    category: "marketing",
    width: 1200,
    height: 1600,
    aspect: "3:4",
    tags: ["email", "newsletter", "tech", "marketing", "بريد", "نشرة"],
    layers: [
      { id: "bg-canvas", name: "الخلفية العامة الفاتحة", kind: "background", color: "#f1f5f9" },
      { id: "main-card", name: "بطاقة النشرة البيضاء", kind: "shape", shapeType: "rectangle", x: 100, y: 60, width: 1000, height: 1480, color: "#ffffff" },
      { id: "hero-img", name: "صورة المقال الرئيسي", kind: "shape", shapeType: "rectangle", x: 160, y: 220, width: 880, height: 440, color: "#0284c7" },
      { id: "logo-txt", name: "شعار النشرة", kind: "text", text: "THE DESIGN WIRE • ISSUE #48", x: 600, y: 140, fontSize: 32, color: "#0f172a", fontWeight: "bold" },
      { id: "article-title", name: "عنوان المقال الرئيسي", kind: "text", text: "The Next Era of Generative Creative Tools", x: 600, y: 740, fontSize: 44, color: "#0f172a", fontWeight: "bold" },
      { id: "cta-btn", name: "زر القراءة", kind: "shape", shapeType: "rectangle", x: 450, y: 920, width: 300, height: 70, color: "#2563eb" },
      { id: "cta-txt", name: "نص الزر", kind: "text", text: "Read Full Article →", x: 600, y: 965, fontSize: 24, color: "#ffffff", fontWeight: "bold" }
    ],
    renderPreview: (ctx, w, h) => {
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(w * 0.08, h * 0.04, w * 0.84, h * 0.92, 16);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.fillStyle = "#0f172a";
      ctx.font = `bold ${Math.round(h * 0.024)}px sans-serif`;
      ctx.fillText("THE DESIGN WIRE   •   ISSUE #48", w / 2, h * 0.09);

      const heroGrad = ctx.createLinearGradient(w * 0.12, h * 0.13, w * 0.88, h * 0.42);
      heroGrad.addColorStop(0, "#3b82f6");
      heroGrad.addColorStop(0.5, "#8b5cf6");
      heroGrad.addColorStop(1, "#ec4899");
      ctx.fillStyle = heroGrad;
      ctx.beginPath();
      ctx.roundRect(w * 0.12, h * 0.13, w * 0.76, h * 0.28, 12);
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.font = `bold ${Math.round(h * 0.03)}px sans-serif`;
      ctx.fillText("The Next Era of Generative Creative Tools", w / 2, h * 0.47);

      ctx.fillStyle = "#64748b";
      ctx.font = `${Math.round(h * 0.016)}px sans-serif`;
      ctx.fillText("How modern browser engines are revolutionizing high-precision digital art.", w / 2, h * 0.51);

      ctx.fillStyle = "#2563eb";
      ctx.beginPath();
      ctx.roundRect(w * 0.35, h * 0.54, w * 0.3, h * 0.045, 8);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(h * 0.016)}px sans-serif`;
      ctx.fillText("Read Full Article →", w / 2, h * 0.57);

      const cy = h * 0.65;
      const cw = w * 0.36;
      const ch = h * 0.22;

      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.roundRect(w * 0.12, cy, cw, ch, 8);
      ctx.fill();
      ctx.fillStyle = "#10b981";
      ctx.fillRect(w * 0.12, cy, cw, ch * 0.45);
      ctx.fillStyle = "#0f172a";
      ctx.font = `bold ${Math.round(h * 0.014)}px sans-serif`;
      ctx.fillText("Design Systems in 2026", w * 0.12 + cw / 2, cy + ch * 0.62);

      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.roundRect(w * 0.52, cy, cw, ch, 8);
      ctx.fill();
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(w * 0.52, cy, cw, ch * 0.45);
      ctx.fillStyle = "#0f172a";
      ctx.font = `bold ${Math.round(h * 0.014)}px sans-serif`;
      ctx.fillText("Typography & Visual Rhythm", w * 0.52 + cw / 2, cy + ch * 0.62);
    }
  },

  // ── Canva Suite Grade 9: Polaroid Aesthetic Story (9:16) ──
  {
    id: "story-polaroid-aesthetic",
    nameAr: "قصة إنستغرام بستايل بولارويد فوتوغرافي جمالي",
    nameEn: "Polaroid Aesthetic Story & Memories",
    category: "tiktok",
    width: 1080,
    height: 1920,
    aspect: "9:16",
    tags: ["story", "polaroid", "aesthetic", "memories", "instagram", "قصة", "بولارويد"],
    layers: [
      { id: "bg-warm", name: "الخلفية البيج الدافئة", kind: "background", color: "#f5ebe0" },
      { id: "washi-tape", name: "شريط التثبيت اللاصق", kind: "shape", shapeType: "rectangle", x: 440, y: 340, width: 200, height: 45, color: "rgba(214,211,209,0.85)" },
      { id: "polaroid-frame", name: "إطار البولارويد الأبيض", kind: "shape", shapeType: "rectangle", x: 180, y: 380, width: 720, height: 900, color: "#ffffff" },
      { id: "caption-handwritten", name: "التعليق المكتوب بخط اليد", kind: "text", text: "golden hour memories ✨", x: 540, y: 1200, fontSize: 44, color: "#44403c" },
      { id: "date-stamp", name: "تاريخ الذكرى", kind: "text", text: "SEPTEMBER 2026", x: 540, y: 1250, fontSize: 24, color: "#a8a29e" }
    ],
    renderPreview: (ctx, w, h) => {
      const bGrad = ctx.createLinearGradient(0, 0, 0, h);
      bGrad.addColorStop(0, "#fdfcf7");
      bGrad.addColorStop(1, "#f3eedf");
      ctx.fillStyle = bGrad;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h * 0.44);
      ctx.rotate(-0.035);

      ctx.shadowColor = "rgba(41, 37, 36, 0.18)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;

      const pw = w * 0.72;
      const ph = h * 0.52;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      ctx.restore();

      ctx.save();
      ctx.translate(w / 2, h * 0.44);
      ctx.rotate(-0.035);
      const iw = pw * 0.88;
      const ih = ph * 0.72;
      const photoGrad = ctx.createLinearGradient(-iw / 2, -ph / 2 + 15, iw / 2, -ph / 2 + 15 + ih);
      photoGrad.addColorStop(0, "#f97316");
      photoGrad.addColorStop(0.5, "#ec4899");
      photoGrad.addColorStop(1, "#8b5cf6");
      ctx.fillStyle = photoGrad;
      ctx.fillRect(-iw / 2, -ph / 2 + 18, iw, ih);

      ctx.fillStyle = "#44403c";
      ctx.font = `italic ${Math.round(h * 0.024)}px "Brush Script MT", "Times New Roman", cursive`;
      ctx.textAlign = "center";
      ctx.fillText("golden hour memories ✨", 0, ph / 2 - 35);

      ctx.fillStyle = "#a8a29e";
      ctx.font = `300 ${Math.round(h * 0.012)}px sans-serif`;
      ctx.fillText("SEPTEMBER 2026", 0, ph / 2 - 14);

      ctx.fillStyle = "rgba(229, 231, 235, 0.75)";
      ctx.fillRect(-w * 0.12, -ph / 2 - 14, w * 0.24, 28);
      ctx.restore();

      const mw = w * 0.75;
      const my = h * 0.84;
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.beginPath();
      ctx.roundRect((w - mw) / 2, my, mw, h * 0.065, 30);
      ctx.fill();

      ctx.fillStyle = "#1e293b";
      ctx.font = `bold ${Math.round(h * 0.016)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("♫  Golden Hours  •  Joji", w / 2, my + h * 0.038);
    }
  },

  // 10. Instagram Commercial Sale (1080x1080)
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
      { id: "sun", name: "القرص المتوهج", kind: "shape", shapeType: "ellipse", x: 1240, y: 1500, width: 1200, height: 1200, color: "#0ea5e9" },
      { id: "title", name: "عنوان العمل الفني", kind: "text", text: "NEON HORIZON", x: 1240, y: 800, fontSize: 120, color: "#ffffff", fontWeight: "bold" },
      { id: "sub", name: "الوصف", kind: "text", text: "AN AUDIO-VISUAL IMMERSIVE EXHIBITION", x: 1240, y: 980, fontSize: 40, color: "#fb7185" }
    ],
    renderPreview: (ctx, w, h) => {
      ctx.fillStyle = "#050508";
      ctx.fillRect(0, 0, w, h);

      // Neon circle
      const sun = ctx.createRadialGradient(w / 2, h * 0.5, 10, w / 2, h * 0.5, w * 0.4);
      sun.addColorStop(0, "#0ea5e9");
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

