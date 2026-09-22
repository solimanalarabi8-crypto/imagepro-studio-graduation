/**
 * ImagePro Studio — Curated Royalty-Free Stock Photos Library
 * High-fidelity procedural & vector photographic renders with zero external network dependencies
 */

export type StockPhotoCategory =
  | "all"
  | "studio"
  | "portrait"
  | "nature"
  | "architecture"
  | "business"
  | "food"
  | "textures"
  | "cyberpunk";

export interface StockPhotoItem {
  id: string;
  nameAr: string;
  nameEn: string;
  category: StockPhotoCategory;
  tags: string[];
  aspect: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  width: number;
  height: number;
  author: string;
  dominantColor: string;
  render: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export const STOCK_PHOTO_CATEGORIES: { id: StockPhotoCategory; nameAr: string; nameEn: string; icon: string }[] = [
  { id: "all", nameAr: "جميع الصور", nameEn: "All Photos", icon: "📸" },
  { id: "studio", nameAr: "استوديو ومنتجات", nameEn: "Studio & Products", icon: "🛍️" },
  { id: "portrait", nameAr: "وجوه وبورتريه", nameEn: "Portraits & People", icon: "👤" },
  { id: "nature", nameAr: "طبيعة ومناظر", nameEn: "Nature & Landscape", icon: "🌿" },
  { id: "architecture", nameAr: "عمارة وديكور", nameEn: "Architecture & Interior", icon: "🏛️" },
  { id: "business", nameAr: "أعمال وتقنية", nameEn: "Business & Work", icon: "💼" },
  { id: "food", nameAr: "مأكولات ومقاهي", nameEn: "Food & Drinks", icon: "☕" },
  { id: "textures", nameAr: "خامات وأسطح", nameEn: "Textures & Surfaces", icon: "🪵" },
  { id: "cyberpunk", nameAr: "سايبربانك ونيون", nameEn: "Cyberpunk & Neon", icon: "⚡" },
];

export const STOCK_PHOTOS: StockPhotoItem[] = [
  // 1. Studio Product Pedestal
  {
    id: "stock-studio-pedestal",
    nameAr: "منصة رخامية فخمة مع إضاءة استوديو ناعمة",
    nameEn: "Luxury Marble Pedestal with Soft Studio Glow",
    category: "studio",
    tags: ["studio", "product", "marble", "pedestal", "podium", "رخام", "منتج"],
    aspect: "1:1",
    width: 1200,
    height: 1200,
    author: "ImagePro Studio Curated",
    dominantColor: "#0f172a",
    render: (ctx, w, h) => {
      // Background studio drop
      const bg = ctx.createRadialGradient(w / 2, h * 0.35, 50, w / 2, h / 2, w * 0.7);
      bg.addColorStop(0, "#1e293b");
      bg.addColorStop(0.6, "#0f172a");
      bg.addColorStop(1, "#020617");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Soft spotlight top
      const spot = ctx.createRadialGradient(w / 2, h * 0.2, 20, w / 2, h * 0.4, w * 0.45);
      spot.addColorStop(0, "rgba(255,255,255,0.22)");
      spot.addColorStop(0.5, "rgba(255,255,255,0.04)");
      spot.addColorStop(1, "transparent");
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, w, h);

      // Floor plane
      const floorGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
      floorGrad.addColorStop(0, "#090d16");
      floorGrad.addColorStop(1, "#020617");
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, h * 0.65, w, h * 0.35);

      // Horizon rim light
      ctx.strokeStyle = "rgba(56,189,248,0.18)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.65);
      ctx.lineTo(w, h * 0.65);
      ctx.stroke();

      // Pedestal Cylinder
      const cx = w / 2;
      const cy = h * 0.72;
      const rx = w * 0.28;
      const ry = h * 0.08;
      const ch = h * 0.16;

      // Shadow under pedestal
      const shadow = ctx.createRadialGradient(cx, cy + ch + ry, 10, cx, cy + ch + ry, rx * 1.3);
      shadow.addColorStop(0, "rgba(0,0,0,0.7)");
      shadow.addColorStop(1, "transparent");
      ctx.fillStyle = shadow;
      ctx.beginPath();
      ctx.ellipse(cx, cy + ch + ry, rx * 1.3, ry * 1.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pedestal side
      const sideGrad = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
      sideGrad.addColorStop(0, "#334155");
      sideGrad.addColorStop(0.3, "#64748b");
      sideGrad.addColorStop(0.7, "#475569");
      sideGrad.addColorStop(1, "#1e293b");
      ctx.fillStyle = sideGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI);
      ctx.lineTo(cx + rx, cy + ch);
      ctx.ellipse(cx, cy + ch, rx, ry, 0, 0, Math.PI, false);
      ctx.lineTo(cx - rx, cy);
      ctx.fill();

      // Top oval with marble shine
      const topGrad = ctx.createRadialGradient(cx, cy - ry * 0.3, 10, cx, cy, rx);
      topGrad.addColorStop(0, "#f8fafc");
      topGrad.addColorStop(0.5, "#cbd5e1");
      topGrad.addColorStop(1, "#94a3b8");
      ctx.fillStyle = topGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rim reflection on top edge
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, Math.PI * 0.9, Math.PI * 2.1);
      ctx.stroke();
    },
  },

  // 2. Portrait Studio Silhouette
  {
    id: "stock-portrait-duotone",
    nameAr: "بورتريه فني بإضاءة سينمائية مزدوجة (Cyan & Coral)",
    nameEn: "Cinematic Duotone Portrait Silhouette",
    category: "portrait",
    tags: ["portrait", "person", "duotone", "cinematic", "lighting", "بورتريه", "وجه"],
    aspect: "3:4",
    width: 1200,
    height: 1600,
    author: "ImagePro Studio Curated",
    dominantColor: "#030712",
    render: (ctx, w, h) => {
      // Dark cinematic canvas
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, w, h);

      // Cyan light left
      const cyanGlow = ctx.createRadialGradient(w * 0.15, h * 0.45, 30, w * 0.2, h * 0.5, w * 0.6);
      cyanGlow.addColorStop(0, "rgba(6,182,212,0.4)");
      cyanGlow.addColorStop(1, "transparent");
      ctx.fillStyle = cyanGlow;
      ctx.fillRect(0, 0, w, h);

      // Coral light right
      const coralGlow = ctx.createRadialGradient(w * 0.85, h * 0.45, 30, w * 0.8, h * 0.5, w * 0.6);
      coralGlow.addColorStop(0, "rgba(244,63,94,0.35)");
      coralGlow.addColorStop(1, "transparent");
      ctx.fillStyle = coralGlow;
      ctx.fillRect(0, 0, w, h);

      // Portrait Head Silhouette & Rim
      const cx = w * 0.5;
      const cy = h * 0.46;
      const r = w * 0.22;

      // Shoulder path
      ctx.fillStyle = "#090d16";
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.38, h);
      ctx.bezierCurveTo(cx - w * 0.35, h * 0.72, cx - w * 0.22, h * 0.65, cx - w * 0.12, h * 0.62);
      ctx.lineTo(cx - w * 0.1, cy + r * 0.8);
      ctx.lineTo(cx + w * 0.1, cy + r * 0.8);
      ctx.lineTo(cx + w * 0.12, h * 0.62);
      ctx.bezierCurveTo(cx + w * 0.22, h * 0.65, cx + w * 0.35, h * 0.72, cx + w * 0.38, h);
      ctx.closePath();
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 0.85, r * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cyan rim light on left edge
      ctx.strokeStyle = "rgba(6,182,212,0.9)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 0.85, r * 1.15, 0, Math.PI * 0.6, Math.PI * 1.4);
      ctx.stroke();

      // Coral rim light on right edge
      ctx.strokeStyle = "rgba(244,63,94,0.9)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 0.85, r * 1.15, 0, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
    },
  },

  // 3. Nature Golden Mountain
  {
    id: "stock-nature-golden-mountain",
    nameAr: "قمم جبلية ضبابية مع شروق شمس ذهبي",
    nameEn: "Misty Mountain Peaks at Golden Sunrise",
    category: "nature",
    tags: ["nature", "mountain", "sunrise", "fog", "landscape", "طبيعة", "جبال"],
    aspect: "16:9",
    width: 1920,
    height: 1080,
    author: "ImagePro Studio Curated",
    dominantColor: "#1e1b4b",
    render: (ctx, w, h) => {
      // Sunrise sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.75);
      sky.addColorStop(0, "#0f172a");
      sky.addColorStop(0.35, "#312e81");
      sky.addColorStop(0.65, "#f59e0b");
      sky.addColorStop(0.9, "#fef3c7");
      sky.addColorStop(1, "#f97316");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Glowing Sun Disc
      const sunGlow = ctx.createRadialGradient(w * 0.52, h * 0.52, 10, w * 0.52, h * 0.52, w * 0.35);
      sunGlow.addColorStop(0, "rgba(255,255,255,0.95)");
      sunGlow.addColorStop(0.2, "rgba(254,240,138,0.7)");
      sunGlow.addColorStop(0.6, "rgba(249,115,22,0.25)");
      sunGlow.addColorStop(1, "transparent");
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, w, h);

      // Distant mountain layers (3 layers)
      // Layer 1: Distant misty
      ctx.fillStyle = "rgba(49,46,129,0.55)";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.65);
      ctx.lineTo(w * 0.25, h * 0.48);
      ctx.lineTo(w * 0.5, h * 0.58);
      ctx.lineTo(w * 0.75, h * 0.45);
      ctx.lineTo(w, h * 0.6);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // Mist haze
      const mist = ctx.createLinearGradient(0, h * 0.55, 0, h * 0.75);
      mist.addColorStop(0, "transparent");
      mist.addColorStop(0.5, "rgba(254,243,199,0.3)");
      mist.addColorStop(1, "transparent");
      ctx.fillStyle = mist;
      ctx.fillRect(0, h * 0.5, w, h * 0.3);

      // Layer 2: Midground
      ctx.fillStyle = "#1e1b4b";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.72);
      ctx.lineTo(w * 0.35, h * 0.54);
      ctx.lineTo(w * 0.65, h * 0.68);
      ctx.lineTo(w * 0.9, h * 0.52);
      ctx.lineTo(w, h * 0.65);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // Layer 3: Foreground silhouette
      ctx.fillStyle = "#09090b";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.82);
      ctx.lineTo(w * 0.2, h * 0.68);
      ctx.lineTo(w * 0.48, h * 0.85);
      ctx.lineTo(w * 0.8, h * 0.64);
      ctx.lineTo(w, h * 0.78);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();
    },
  },

  // 4. Modern Architecture Concrete & Glass
  {
    id: "stock-arch-minimalist",
    nameAr: "عمارة مودرن بزوايا هندسية وإضاءة نهارية",
    nameEn: "Minimalist Modern Architectural Angles",
    category: "architecture",
    tags: ["architecture", "interior", "minimal", "concrete", "angles", "عمارة", "تصميم"],
    aspect: "4:3",
    width: 1600,
    height: 1200,
    author: "ImagePro Studio Curated",
    dominantColor: "#f1f5f9",
    render: (ctx, w, h) => {
      // Pale blue sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#bae6fd");
      sky.addColorStop(0.6, "#e0f2fe");
      sky.addColorStop(1, "#f8fafc");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Huge architectural concrete cantilever
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.2);
      ctx.lineTo(w * 0.68, h * 0.35);
      ctx.lineTo(w * 0.45, h * 0.95);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Shadow underside of cantilever
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.moveTo(w * 0.45, h * 0.95);
      ctx.lineTo(w * 0.68, h * 0.35);
      ctx.lineTo(w, h * 0.48);
      ctx.lineTo(w * 0.7, h);
      ctx.closePath();
      ctx.fill();

      // Blue tinted glass facade
      const glass = ctx.createLinearGradient(w * 0.5, 0, w, h);
      glass.addColorStop(0, "rgba(56,189,248,0.7)");
      glass.addColorStop(0.5, "rgba(14,165,233,0.85)");
      glass.addColorStop(1, "rgba(2,132,199,0.9)");
      ctx.fillStyle = glass;
      ctx.beginPath();
      ctx.moveTo(w * 0.68, h * 0.35);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h * 0.48);
      ctx.closePath();
      ctx.fill();

      // Window mullion grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 2;
      for (let i = 1; i <= 6; i++) {
        const t = i / 7;
        ctx.beginPath();
        ctx.moveTo(w * 0.68 + (w * 0.32) * t, (h * 0.35) * (1 - t));
        ctx.lineTo(w * 0.68 + (w * 0.32) * t, h * 0.4);
        ctx.stroke();
      }
    },
  },

  // 5. Business Workspace & Laptop
  {
    id: "stock-biz-clean-desk",
    nameAr: "مساحة عمل احترافية ومينيمال مع حاسوب محمول وقهوة",
    nameEn: "Clean Minimalist Tech Workspace Flatlay",
    category: "business",
    tags: ["business", "laptop", "workspace", "desk", "coffee", "مكتب", "تقنية"],
    aspect: "16:9",
    width: 1920,
    height: 1080,
    author: "ImagePro Studio Curated",
    dominantColor: "#f8fafc",
    render: (ctx, w, h) => {
      // Warm neutral oak desk
      const desk = ctx.createLinearGradient(0, 0, w, h);
      desk.addColorStop(0, "#f8fafc");
      desk.addColorStop(0.5, "#f1f5f9");
      desk.addColorStop(1, "#e2e8f0");
      ctx.fillStyle = desk;
      ctx.fillRect(0, 0, w, h);

      // Laptop base center
      const lx = w * 0.3;
      const ly = h * 0.25;
      const lw = w * 0.4;
      const lh = h * 0.5;

      // Laptop shadow
      const lShadow = ctx.createRadialGradient(lx + lw / 2, ly + lh / 2 + 30, 20, lx + lw / 2, ly + lh / 2 + 30, lw * 0.65);
      lShadow.addColorStop(0, "rgba(0,0,0,0.18)");
      lShadow.addColorStop(1, "transparent");
      ctx.fillStyle = lShadow;
      ctx.fillRect(0, 0, w, h);

      // Laptop Body (Space Gray)
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.roundRect(lx, ly, lw, lh, 14);
      ctx.fill();

      // Laptop screen bezel
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(lx + lw * 0.04, ly + lh * 0.04, lw * 0.92, lh * 0.92, 8);
      ctx.fill();

      // Screen glowing gradient (code/dashboard aesthetic)
      const screenGrad = ctx.createLinearGradient(lx, ly, lx + lw, ly + lh);
      screenGrad.addColorStop(0, "#0369a1");
      screenGrad.addColorStop(0.5, "#0284c7");
      screenGrad.addColorStop(1, "#0d9488");
      ctx.fillStyle = screenGrad;
      ctx.beginPath();
      ctx.roundRect(lx + lw * 0.06, ly + lh * 0.06, lw * 0.88, lh * 0.88, 6);
      ctx.fill();

      // Screen code mock lines
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      for (let i = 0; i < 7; i++) {
        ctx.fillRect(lx + lw * 0.12, ly + lh * (0.15 + i * 0.1), lw * (0.3 + (i % 3) * 0.18), 6);
      }

      // Ceramic coffee cup on right
      const cx = w * 0.82;
      const cy = h * 0.42;
      const cr = w * 0.055;

      // Cup shadow
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.beginPath();
      ctx.ellipse(cx + 8, cy + 12, cr * 1.1, cr * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Saucer
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();

      // Inner cup
      ctx.fillStyle = "#451a03"; // Rich espresso
      ctx.beginPath();
      ctx.arc(cx, cy, cr * 0.78, 0, Math.PI * 2);
      ctx.fill();

      // Latte foam swirl
      ctx.fillStyle = "#fed7aa";
      ctx.beginPath();
      ctx.ellipse(cx, cy, cr * 0.35, cr * 0.25, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  // 6. Food Artisan Espresso & Croissant
  {
    id: "stock-food-artisan-cafe",
    nameAr: "مقهى راقٍ مع كوب قهوة مختصة وكرواسون ذهبي",
    nameEn: "Artisan Coffee Cafe & Golden Flaky Pastry",
    category: "food",
    tags: ["food", "coffee", "pastry", "cafe", "espresso", "قهوة", "طعام"],
    aspect: "1:1",
    width: 1200,
    height: 1200,
    author: "ImagePro Studio Curated",
    dominantColor: "#451a03",
    render: (ctx, w, h) => {
      // Warm walnut wood tabletop
      const wood = ctx.createLinearGradient(0, 0, 0, h);
      wood.addColorStop(0, "#292524");
      wood.addColorStop(0.5, "#1c1917");
      wood.addColorStop(1, "#0c0a09");
      ctx.fillStyle = wood;
      ctx.fillRect(0, 0, w, h);

      // Wood grain lines
      ctx.strokeStyle = "rgba(120,113,108,0.12)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 18; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (h / 18) * i);
        ctx.bezierCurveTo(w * 0.3, (h / 18) * i + 15, w * 0.7, (h / 18) * i - 15, w, (h / 18) * i);
        ctx.stroke();
      }

      // Warm amber overhead spotlight
      const warmLight = ctx.createRadialGradient(w * 0.5, h * 0.5, 40, w * 0.5, h * 0.5, w * 0.55);
      warmLight.addColorStop(0, "rgba(245,158,11,0.22)");
      warmLight.addColorStop(0.7, "rgba(217,119,6,0.06)");
      warmLight.addColorStop(1, "transparent");
      ctx.fillStyle = warmLight;
      ctx.fillRect(0, 0, w, h);

      // Ceramic cup and latte art
      const cupX = w * 0.45;
      const cupY = h * 0.52;
      const cupR = w * 0.18;

      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.arc(cupX + 15, cupY + 20, cupR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fafaf9";
      ctx.beginPath();
      ctx.arc(cupX, cupY, cupR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#3e2723";
      ctx.beginPath();
      ctx.arc(cupX, cupY, cupR * 0.85, 0, Math.PI * 2);
      ctx.fill();

      // Cream latte heart
      ctx.fillStyle = "#fef3c7";
      ctx.beginPath();
      ctx.moveTo(cupX, cupY + cupR * 0.4);
      ctx.bezierCurveTo(cupX - cupR * 0.6, cupY, cupX - cupR * 0.4, cupY - cupR * 0.5, cupX, cupY - cupR * 0.2);
      ctx.bezierCurveTo(cupX + cupR * 0.4, cupY - cupR * 0.5, cupX + cupR * 0.6, cupY, cupX, cupY + cupR * 0.4);
      ctx.fill();
    },
  },

  // 7. Textures Carrara Gold-Veined Marble
  {
    id: "stock-texture-carrara-marble",
    nameAr: "رخام كرارا إيطالي فاخر مع عروق ذهبية ورمادية",
    nameEn: "Italian Carrara White Marble with Gold Veining",
    category: "textures",
    tags: ["texture", "marble", "carrara", "gold", "surface", "رخام", "خامة"],
    aspect: "1:1",
    width: 1600,
    height: 1600,
    author: "ImagePro Studio Curated",
    dominantColor: "#f8fafc",
    render: (ctx, w, h) => {
      // Soft marble base
      const base = ctx.createLinearGradient(0, 0, w, h);
      base.addColorStop(0, "#ffffff");
      base.addColorStop(0.3, "#f8fafc");
      base.addColorStop(0.7, "#f1f5f9");
      base.addColorStop(1, "#e2e8f0");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);

      // Grey subtle deep veins
      ctx.strokeStyle = "rgba(148,163,184,0.35)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.2);
      ctx.bezierCurveTo(w * 0.3, h * 0.35, w * 0.5, h * 0.15, w * 0.85, h * 0.6);
      ctx.bezierCurveTo(w * 0.95, h * 0.75, w * 0.7, h * 0.9, w, h * 0.85);
      ctx.stroke();

      // Gold delicate veins
      ctx.strokeStyle = "rgba(217,119,6,0.55)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, 0);
      ctx.bezierCurveTo(w * 0.25, h * 0.4, w * 0.6, h * 0.45, w * 0.75, h);
      ctx.stroke();

      ctx.strokeStyle = "rgba(245,158,11,0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.25, h * 0.4);
      ctx.bezierCurveTo(w * 0.4, h * 0.6, w * 0.35, h * 0.8, w * 0.5, h);
      ctx.stroke();
    },
  },

  // 8. Cyberpunk Neon Tokyo Grid
  {
    id: "stock-cyberpunk-tokyo-grid",
    nameAr: "أفق سايبربانك مستقبلي مع شبكة نيون وشمس رقمية",
    nameEn: "Synthwave Cyberpunk Cityscape & Neon Grid",
    category: "cyberpunk",
    tags: ["cyberpunk", "neon", "grid", "synthwave", "future", "سايبربانك", "نيون"],
    aspect: "16:9",
    width: 1920,
    height: 1080,
    author: "ImagePro Studio Curated",
    dominantColor: "#050515",
    render: (ctx, w, h) => {
      // Cosmic deep night sky
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
      sky.addColorStop(0, "#02000a");
      sky.addColorStop(0.5, "#1a0033");
      sky.addColorStop(1, "#3b0764");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.6);

      // Synthwave Neon Sun
      const sunY = h * 0.55;
      const sunR = h * 0.25;
      const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
      sunGrad.addColorStop(0, "#fde047");
      sunGrad.addColorStop(0.5, "#0ea5e9");
      sunGrad.addColorStop(1, "#d946ef");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(w / 2, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();

      // Horizontal blinds cutting into sun
      ctx.fillStyle = "#1a0033";
      for (let i = 1; i <= 6; i++) {
        const barH = 3 + i * 2;
        const barY = sunY + i * 14;
        ctx.fillRect(w / 2 - sunR, barY, sunR * 2, barH);
      }

      // Horizon line glow
      const horizonGlow = ctx.createLinearGradient(0, h * 0.58, 0, h * 0.62);
      horizonGlow.addColorStop(0, "rgba(217,70,239,0.8)");
      horizonGlow.addColorStop(1, "rgba(6,182,212,0.9)");
      ctx.fillStyle = horizonGlow;
      ctx.fillRect(0, h * 0.59, w, 4);

      // Perspective 3D Grid Floor
      const floor = ctx.createLinearGradient(0, h * 0.6, 0, h);
      floor.addColorStop(0, "#050014");
      floor.addColorStop(1, "#0f0524");
      ctx.fillStyle = floor;
      ctx.fillRect(0, h * 0.6, w, h * 0.4);

      // Cyan grid lines
      ctx.strokeStyle = "rgba(6,182,212,0.65)";
      ctx.lineWidth = 1.5;

      // Horizon converging lines
      const vanishingX = w / 2;
      const vanishingY = h * 0.6;
      for (let i = -12; i <= 12; i++) {
        ctx.beginPath();
        ctx.moveTo(vanishingX, vanishingY);
        ctx.lineTo(w / 2 + i * (w * 0.08), h);
        ctx.stroke();
      }

      // Horizontal perspective grid steps
      for (let i = 1; i <= 10; i++) {
        const factor = Math.pow(i / 10, 2);
        const y = vanishingY + factor * (h * 0.4);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
  },
];

/**
 * Filter stock photos by category and search query
 */
export function filterStockPhotos(
  photos: StockPhotoItem[],
  category: StockPhotoCategory,
  query: string
): StockPhotoItem[] {
  let res = photos;
  if (category !== "all") {
    res = res.filter((p) => p.category === category);
  }
  const cleanQ = query.trim().toLowerCase();
  if (cleanQ) {
    res = res.filter(
      (p) =>
        p.nameAr.toLowerCase().includes(cleanQ) ||
        p.nameEn.toLowerCase().includes(cleanQ) ||
        p.tags.some((t) => t.toLowerCase().includes(cleanQ))
    );
  }
  return res;
}

