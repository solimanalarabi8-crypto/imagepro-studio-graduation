/**
 * ImagePro Studio — Creative Backdrops Catalog (12 High-Definition Categories)
 * Procedural & Commercial Canvas Renderers with High-Fidelity Lighting & Shadows
 */

export type BackdropCategory =
  | "studio"
  | "marble"
  | "wood"
  | "luxury"
  | "gold"
  | "glass"
  | "concrete"
  | "nature"
  | "mountains"
  | "ocean"
  | "technology"
  | "cyberpunk"
  | "fashion"
  | "food"
  | "product"
  | "abstract"
  | "gradients";

export interface CreativeBackdropPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  category: BackdropCategory;
  tags: string[];
  accentColor: string;
  render: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export const CREATIVE_BACKDROP_CATEGORIES: { id: BackdropCategory | "all"; nameAr: string; nameEn: string; icon: string }[] = [
  { id: "all", nameAr: "جميع الخلفيات", nameEn: "All Backdrops", icon: "✨" },
  { id: "studio", nameAr: "استوديو", nameEn: "Studio", icon: "🎬" },
  { id: "marble", nameAr: "رخام", nameEn: "Marble", icon: "🏛️" },
  { id: "wood", nameAr: "خشب", nameEn: "Wood", icon: "🪵" },
  { id: "luxury", nameAr: "فخامة", nameEn: "Luxury", icon: "💎" },
  { id: "gold", nameAr: "ذهبي", nameEn: "Gold", icon: "🪙" },
  { id: "glass", nameAr: "زجاج", nameEn: "Glass", icon: "🪟" },
  { id: "concrete", nameAr: "خرسانة", nameEn: "Concrete", icon: "🧱" },
  { id: "nature", nameAr: "طبيعة", nameEn: "Nature", icon: "🌿" },
  { id: "mountains", nameAr: "جبال", nameEn: "Mountains", icon: "🏔️" },
  { id: "ocean", nameAr: "محيط", nameEn: "Ocean", icon: "🌊" },
  { id: "technology", nameAr: "تقنية", nameEn: "Technology", icon: "⚡" },
  { id: "cyberpunk", nameAr: "سايبربانك", nameEn: "Cyberpunk", icon: "🌆" },
  { id: "fashion", nameAr: "أزياء", nameEn: "Fashion", icon: "👗" },
  { id: "food", nameAr: "مأكولات", nameEn: "Food", icon: "☕" },
  { id: "product", nameAr: "تصوير منتجات", nameEn: "Product Photography", icon: "🛍️" },
  { id: "abstract", nameAr: "تجريدي", nameEn: "Abstract", icon: "🎨" },
  { id: "gradients", nameAr: "تدرجات", nameEn: "Gradients", icon: "🌈" },
];

export const CREATIVE_BACKDROPS: CreativeBackdropPreset[] = [
  // 1. Product
  {
    id: "prod-marble-podium",
    nameAr: "منصة رخامية تجارية مع إضاءة علوية",
    nameEn: "Commercial Marble Podium",
    category: "product",
    tags: ["podium", "marble", "store", "commercial", "عرض"],
    accentColor: "#cbd5e1",
    render: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#f1f5f9");
      grad.addColorStop(0.7, "#cbd5e1");
      grad.addColorStop(1, "#94a3b8");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Light beam
      const spot = ctx.createRadialGradient(w / 2, h * 0.3, 10, w / 2, h * 0.4, w * 0.6);
      spot.addColorStop(0, "rgba(255,255,255,0.7)");
      spot.addColorStop(1, "transparent");
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, w, h);

      // Podium shadow
      const py = h * 0.8;
      const pw = w * 0.55;
      const ph = h * 0.14;
      ctx.fillStyle = "rgba(15,23,42,0.35)";
      ctx.beginPath();
      ctx.ellipse(w / 2, py + ph * 0.4, pw * 0.6, ph * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Podium top
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(w / 2, py, pw / 2, ph / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(203,213,225,0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  },

  // 2. Studio
  {
    id: "studio-cinematic-glow",
    nameAr: "استوديو سينمائي داكن بضوء موضعي",
    nameEn: "Cinematic Dark Studio Spotlight",
    category: "studio",
    tags: ["spotlight", "cinematic", "dark", "focus", "إضاءة"],
    accentColor: "#2dd4bf",
    render: (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#0b1315");
      bg.addColorStop(0.7, "#06090a");
      bg.addColorStop(1, "#020404");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Teal key spotlight
      const spot = ctx.createRadialGradient(w / 2, h * 0.35, 10, w / 2, h * 0.5, w * 0.55);
      spot.addColorStop(0, "rgba(45,212,191,0.22)");
      spot.addColorStop(0.5, "rgba(6,182,212,0.08)");
      spot.addColorStop(1, "transparent");
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, w, h);
    }
  },

  // 3. Luxury
  {
    id: "lux-gold-silk",
    nameAr: "حرير ذهبي وأمواج مخملية فاخرة",
    nameEn: "Royal Gold Velvet Silk",
    category: "luxury",
    tags: ["gold", "silk", "royal", "velvet", "ذهب"],
    accentColor: "#f59e0b",
    render: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#2a1b04");
      grad.addColorStop(0.4, "#452d0a");
      grad.addColorStop(0.7, "#201402");
      grad.addColorStop(1, "#120b00");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Golden silk curves
      ctx.strokeStyle = "rgba(245,158,11,0.25)";
      ctx.lineWidth = 40;
      ctx.beginPath();
      ctx.moveTo(-w * 0.2, h * 0.3);
      ctx.bezierCurveTo(w * 0.3, h * 0.1, w * 0.7, h * 0.8, w * 1.2, h * 0.4);
      ctx.stroke();

      ctx.strokeStyle = "rgba(251,191,36,0.35)";
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(-w * 0.1, h * 0.6);
      ctx.bezierCurveTo(w * 0.4, h * 0.9, w * 0.8, h * 0.2, w * 1.1, h * 0.7);
      ctx.stroke();
    }
  },

  // 4. Nature
  {
    id: "nature-sun-shadows",
    nameAr: "ظلال أوراق النخيل وأشعة الشمس الدافئة",
    nameEn: "Palm Leaf Sunlit Shadows",
    category: "nature",
    tags: ["sun", "leaves", "natural", "warm", "ظلال"],
    accentColor: "#10b981",
    render: (ctx, w, h) => {
      // Warm sun wall
      const wall = ctx.createLinearGradient(0, 0, w, h);
      wall.addColorStop(0, "#fffbeb");
      wall.addColorStop(0.6, "#fef3c7");
      wall.addColorStop(1, "#fde68a");
      ctx.fillStyle = wall;
      ctx.fillRect(0, 0, w, h);

      // Palm leaf shadow projections
      ctx.fillStyle = "rgba(120,53,15,0.08)";
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        const angle = (i * 12 * Math.PI) / 180;
        ctx.ellipse(w * 0.15 + i * 20, h * 0.2 + i * 40, w * 0.35, h * 0.08, angle, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  // 5. Technology
  {
    id: "tech-cyber-grid",
    nameAr: "شبكة سايبر نيون وتدرج تقني متطور",
    nameEn: "Cyberpunk Neon Tech Grid",
    category: "technology",
    tags: ["cyber", "neon", "grid", "tech", "نيون"],
    accentColor: "#3b82f6",
    render: (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#020617");
      bg.addColorStop(1, "#0f172a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Perspective grid floor
      ctx.strokeStyle = "rgba(59,130,246,0.18)";
      ctx.lineWidth = 1;
      const horizon = h * 0.55;
      for (let x = -w; x <= w * 2; x += w * 0.1) {
        ctx.beginPath();
        ctx.moveTo(w / 2, horizon);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = horizon; y <= h; y += (h - horizon) / 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Cyan glow on horizon
      const glow = ctx.createRadialGradient(w / 2, horizon, 5, w / 2, horizon, w * 0.5);
      glow.addColorStop(0, "rgba(56,189,248,0.3)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    }
  },

  // 6. Food
  {
    id: "food-rustic-wood",
    nameAr: "طاولة خشبية دافئة وإضاءة مقاهي",
    nameEn: "Rustic Wooden Tabletop Cafe",
    category: "food",
    tags: ["wood", "cafe", "table", "rustic", "خشب"],
    accentColor: "#d97706",
    render: (ctx, w, h) => {
      // Wood plank gradient
      const wood = ctx.createLinearGradient(0, 0, 0, h);
      wood.addColorStop(0, "#451a03");
      wood.addColorStop(0.5, "#78350f");
      wood.addColorStop(1, "#3c1503");
      ctx.fillStyle = wood;
      ctx.fillRect(0, 0, w, h);

      // Plank separation lines
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 2;
      for (let y = h * 0.2; y < h; y += h * 0.2) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Warm overhead cafe lamp
      const lamp = ctx.createRadialGradient(w / 2, h * 0.4, 20, w / 2, h * 0.5, w * 0.6);
      lamp.addColorStop(0, "rgba(251,191,36,0.35)");
      lamp.addColorStop(1, "transparent");
      ctx.fillStyle = lamp;
      ctx.fillRect(0, 0, w, h);
    }
  },

  // 7. Fashion
  {
    id: "fashion-pastel-editorial",
    nameAr: "استوديو أزياء عصري بتدرج باستيل راقٍ",
    nameEn: "Pastel Editorial Fashion Studio",
    category: "fashion",
    tags: ["fashion", "pastel", "editorial", "runway", "موضة"],
    accentColor: "#ec4899",
    render: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#fce7f3");
      grad.addColorStop(0.5, "#f3e8ff");
      grad.addColorStop(1, "#e0e7ff");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Geometric runway circle
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.6, w * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // 8. Beauty
  {
    id: "beauty-soft-glow",
    nameAr: "بودرة ناعمة وإضاءة جمالية دافئة",
    nameEn: "Blushing Glow Beauty Backdrop",
    category: "beauty",
    tags: ["beauty", "cosmetics", "glow", "powder", "جمال"],
    accentColor: "#f43f5e",
    render: (ctx, w, h) => {
      const grad = ctx.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h * 0.5, w * 0.7);
      grad.addColorStop(0, "#ffe4e6");
      grad.addColorStop(0.5, "#fecdd3");
      grad.addColorStop(1, "#fda4af");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Soft light diffuse
      const diffuse = ctx.createRadialGradient(w * 0.3, h * 0.3, 5, w * 0.3, h * 0.3, w * 0.4);
      diffuse.addColorStop(0, "rgba(255,255,255,0.7)");
      diffuse.addColorStop(1, "transparent");
      ctx.fillStyle = diffuse;
      ctx.fillRect(0, 0, w, h);
    }
  },

  // 9. Business
  {
    id: "biz-corporate-glass",
    nameAr: "مبنى شركات وزجاج مكتبي عصري",
    nameEn: "Modern Corporate Architecture",
    category: "business",
    tags: ["business", "corporate", "office", "glass", "أعمال"],
    accentColor: "#0284c7",
    render: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#0f172a");
      grad.addColorStop(0.5, "#1e293b");
      grad.addColorStop(1, "#334155");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Architectural blue beam
      ctx.strokeStyle = "rgba(14,165,233,0.15)";
      ctx.lineWidth = 60;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, 0);
      ctx.lineTo(w * 0.8, h);
      ctx.stroke();
    }
  },

  // 10. Abstract
  {
    id: "abstract-aurora-fluid",
    nameAr: "أمواج شفق قطبي سائلة ومتمازجة",
    nameEn: "Aurora Borealis Fluid Waves",
    category: "abstract",
    tags: ["aurora", "fluid", "waves", "abstract", "تجريدي"],
    accentColor: "#8b5cf6",
    render: (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#050515");
      bg.addColorStop(0.5, "#0d0c2e");
      bg.addColorStop(1, "#02020a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Purple and green glowing waves
      ctx.strokeStyle = "rgba(139,92,246,0.3)";
      ctx.lineWidth = 50;
      ctx.beginPath();
      ctx.moveTo(-w * 0.1, h * 0.4);
      ctx.bezierCurveTo(w * 0.4, h * 0.1, w * 0.6, h * 0.9, w * 1.1, h * 0.5);
      ctx.stroke();

      ctx.strokeStyle = "rgba(45,212,191,0.25)";
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.moveTo(-w * 0.1, h * 0.6);
      ctx.bezierCurveTo(w * 0.3, h * 0.8, w * 0.7, h * 0.2, w * 1.1, h * 0.7);
      ctx.stroke();
    }
  },

  // 11. 3D
  {
    id: "3d-geometric-pedestal",
    nameAr: "قاعدة هندسية سداسية ثلاثية الأبعاد",
    nameEn: "3D Hexagonal Minimal Pedestal",
    category: "3d",
    tags: ["3d", "pedestal", "geometric", "hex", "منصة"],
    accentColor: "#6366f1",
    render: (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#e0e7ff");
      bg.addColorStop(0.7, "#c7d2fe");
      bg.addColorStop(1, "#a5b4fc");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Soft ground ambient shadow
      ctx.fillStyle = "rgba(67,56,202,0.25)";
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.82, w * 0.35, h * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pedestal top plane
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.75, w * 0.3, h * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // 12. Minimal
  {
    id: "minimal-pure-clean",
    nameAr: "تدرج مينيمال استوديو نقي وفاتح",
    nameEn: "Pure Minimal Seamless Studio",
    category: "minimal",
    tags: ["minimal", "clean", "white", "seamless", "أبيض"],
    accentColor: "#94a3b8",
    render: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.6, "#f8fafc");
      grad.addColorStop(1, "#e2e8f0");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  },

  // 13. Carrara Marble Luxury
  {
    id: "luxury-carrara-marble",
    nameAr: "رخام كرارا إيطالي فاخر مع عروق رمادية",
    nameEn: "Italian Carrara White Marble",
    category: "luxury",
    tags: ["marble", "luxury", "stone", "white", "رخام", "فخامة"],
    accentColor: "#cbd5e1",
    render: (ctx, w, h) => {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, w, h);

      // Veins
      ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.2);
      ctx.bezierCurveTo(w * 0.3, h * 0.35, w * 0.6, h * 0.1, w, h * 0.4);
      ctx.stroke();

      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.2, 0);
      ctx.bezierCurveTo(w * 0.35, h * 0.4, w * 0.5, h * 0.7, w * 0.8, h);
      ctx.stroke();

      // Top soft lighting vignette
      const rad = ctx.createRadialGradient(w / 2, h * 0.4, 20, w / 2, h * 0.4, w * 0.6);
      rad.addColorStop(0, "rgba(255,255,255,0.6)");
      rad.addColorStop(1, "rgba(203,213,225,0.2)");
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, w, h);
    }
  },

  // 14. Walnut Wood Tabletop
  {
    id: "wood-walnut-tabletop",
    nameAr: "خشب جوز طبيعي دافئ لعرض المنتجات",
    nameEn: "Natural Dark Walnut Wood Tabletop",
    category: "product",
    tags: ["wood", "tabletop", "warm", "nature", "خشب", "طبيعي"],
    accentColor: "#78350f",
    render: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#451a03");
      grad.addColorStop(0.5, "#290e02");
      grad.addColorStop(1, "#180601");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Wood plank lines
      ctx.strokeStyle = "rgba(120, 53, 15, 0.4)";
      ctx.lineWidth = 2;
      for (let y = 0; y < h; y += h * 0.12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Warm overhead studio spotlight
      const spot = ctx.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h * 0.4, w * 0.5);
      spot.addColorStop(0, "rgba(251, 191, 36, 0.22)");
      spot.addColorStop(1, "transparent");
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, w, h);
    }
  },

  // 15. 24K Gold & Obsidian Luxury
  {
    id: "luxury-gold-obsidian",
    nameAr: "ذهب ملكي عيار 24 مع أوبسيديان أسود",
    nameEn: "24K Gold Leaf & Obsidian Luxury",
    category: "luxury",
    tags: ["gold", "luxury", "black", "metallic", "ذهب", "ملكي"],
    accentColor: "#fbbf24",
    render: (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#09090b");
      bg.addColorStop(0.5, "#18181b");
      bg.addColorStop(1, "#050507");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Gold diagonal ribbons
      const gold = ctx.createLinearGradient(0, 0, w, h);
      gold.addColorStop(0, "#d97706");
      gold.addColorStop(0.3, "#fef08a");
      gold.addColorStop(0.6, "#f59e0b");
      gold.addColorStop(1, "#78350f");

      ctx.strokeStyle = gold;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-w * 0.2, h * 0.3);
      ctx.bezierCurveTo(w * 0.2, h * 0.1, w * 0.6, h * 0.9, w * 1.2, h * 0.7);
      ctx.stroke();

      // Golden shimmer particles
      ctx.fillStyle = "#fbbf24";
      for (let i = 0; i < 24; i++) {
        const px = (Math.sin(i * 99) * 0.5 + 0.5) * w;
        const py = (Math.cos(i * 33) * 0.5 + 0.5) * h;
        const pr = (i % 3) + 1.5;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  // 16. Frosted Glass Refraction
  {
    id: "minimal-frosted-glass",
    nameAr: "زجاج مثلج مع انكسار ضوئي ناعم (Glassmorphism)",
    nameEn: "Frosted Studio Glassmorphism",
    category: "minimal",
    tags: ["glass", "frosted", "minimal", "modern", "زجاج", "عصري"],
    accentColor: "#38bdf8",
    render: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#e0f2fe");
      grad.addColorStop(0.5, "#f0f9ff");
      grad.addColorStop(1, "#bae6fd");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Frosted geometric panels
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(w * 0.1, h * 0.15, w * 0.8, h * 0.7, 16);
      ctx.fill();
      ctx.stroke();
    }
  },

  // 17. Cyberpunk Grid & Neon Horizon
  {
    id: "tech-cyberpunk-grid",
    nameAr: "شبكة سايبربانك مستقبلية بأفق نيون",
    nameEn: "Cyberpunk Synthwave Neon Grid",
    category: "technology",
    tags: ["cyberpunk", "neon", "grid", "synthwave", "نيون", "مستقبل"],
    accentColor: "#ec4899",
    render: (ctx, w, h) => {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, w, h);

      // Neon horizon glow
      const glow = ctx.createLinearGradient(0, h * 0.3, 0, h * 0.6);
      glow.addColorStop(0, "rgba(236, 72, 153, 0.8)");
      glow.addColorStop(1, "rgba(6, 182, 212, 0.2)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, h * 0.45, w, h * 0.1);

      // Perspective grid
      ctx.strokeStyle = "rgba(6, 182, 212, 0.45)";
      ctx.lineWidth = 1.5;
      const horizonY = h * 0.52;
      for (let x = -w; x < w * 2; x += w * 0.15) {
        ctx.beginPath();
        ctx.moveTo(w / 2, horizonY);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = horizonY; y < h; y += (h - horizonY) / 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }
  },

  // 18. Vibrant Sunset Aura Gradient
  {
    id: "abstract-sunset-aura",
    nameAr: "تدرج هالة الغروب الحريري (Aura Mesh)",
    nameEn: "Sunset Aura Vibrant Mesh Gradient",
    category: "gradients",
    tags: ["gradient", "aura", "mesh", "sunset", "تدرج", "غروب"],
    accentColor: "#f97316",
    render: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#4f46e5");
      grad.addColorStop(0.35, "#ec4899");
      grad.addColorStop(0.7, "#f97316");
      grad.addColorStop(1, "#facc15");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Soft white central luminous diffusion
      const rad = ctx.createRadialGradient(w * 0.4, h * 0.45, 10, w * 0.4, h * 0.45, w * 0.5);
      rad.addColorStop(0, "rgba(255,255,255,0.4)");
      rad.addColorStop(1, "transparent");
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, w, h);
    }
  },

  // 19. Italian Carrara White Marble
  {
    id: "marble-carrara-white",
    nameAr: "رخام كرارا إيطالي فاخر مع عروق رمادية",
    nameEn: "Italian Carrara White Veined Marble",
    category: "marble",
    tags: ["marble", "white", "luxury", "stone", "رخام", "إيطالي"],
    accentColor: "#94a3b8",
    render: (ctx, w, h) => {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.2);
      ctx.bezierCurveTo(w * 0.3, h * 0.35, w * 0.6, h * 0.15, w, h * 0.4);
      ctx.stroke();

      ctx.strokeStyle = "rgba(100, 116, 139, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.2, 0);
      ctx.bezierCurveTo(w * 0.4, h * 0.5, w * 0.7, h * 0.6, w * 0.9, h);
      ctx.stroke();

      ctx.strokeStyle = "rgba(203, 213, 225, 0.4)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h);
      ctx.bezierCurveTo(w * 0.5, h * 0.7, w * 0.4, h * 0.3, w, h * 0.1);
      ctx.stroke();
    }
  },

  // 20. Dark Marquina Gold Veined Marble
  {
    id: "marble-black-gold",
    nameAr: "رخام ماركينا أسود مع عروق ذهبية",
    nameEn: "Black Marquina Marble with Golden Veins",
    category: "marble",
    tags: ["marble", "black", "gold", "luxury", "رخام", "أسود"],
    accentColor: "#eab308",
    render: (ctx, w, h) => {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(234, 179, 8, 0.55)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.4);
      ctx.bezierCurveTo(w * 0.35, h * 0.2, w * 0.65, h * 0.7, w, h * 0.5);
      ctx.stroke();

      ctx.strokeStyle = "rgba(250, 204, 21, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w * 0.15, h);
      ctx.bezierCurveTo(w * 0.35, h * 0.6, w * 0.7, h * 0.3, w * 0.85, 0);
      ctx.stroke();
    }
  },

  // 21. Natural Walnut Wood
  {
    id: "wood-walnut-warm",
    nameAr: "خشب الجوز الدافئ مع حبيبات خشبية طبيعية",
    nameEn: "Warm Natural Walnut Wood Grain",
    category: "wood",
    tags: ["wood", "walnut", "timber", "natural", "خشب", "جوز"],
    accentColor: "#78350f",
    render: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#451a03");
      grad.addColorStop(0.5, "#78350f");
      grad.addColorStop(1, "#290e02");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Wood grain rings
      ctx.strokeStyle = "rgba(254, 243, 199, 0.08)";
      for (let y = 0; y < h; y += 12) {
        ctx.lineWidth = Math.random() * 2 + 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.3, y + Math.sin(y) * 8, w * 0.7, y - Math.cos(y) * 8, w, y);
        ctx.stroke();
      }
    }
  },

  // 22. Polished 24K Gold Metal
  {
    id: "gold-foil-luxury",
    nameAr: "لوح ذهب ملكي مصقول عيار 24",
    nameEn: "Royal 24K Polished Specular Gold",
    category: "gold",
    tags: ["gold", "foil", "royal", "metallic", "ذهب", "فخامة"],
    accentColor: "#fbbf24",
    render: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#b45309");
      grad.addColorStop(0.25, "#fef08a");
      grad.addColorStop(0.5, "#d97706");
      grad.addColorStop(0.75, "#fef9c3");
      grad.addColorStop(1, "#92400e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Diagonal sheen lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(-w * 0.2, h * 0.8);
      ctx.lineTo(w * 0.8, -h * 0.2);
      ctx.stroke();
    }
  },

  // 23. Frosted Glassmorphism
  {
    id: "glass-crystal-frosted",
    nameAr: "لوح زجاجي بلوري عاكس مع ضوء خلفي ناعم",
    nameEn: "Frosted Crystal Glassmorphism Backdrop",
    category: "glass",
    tags: ["glass", "frosted", "crystal", "blur", "زجاج"],
    accentColor: "#38bdf8",
    render: (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#0f172a");
      bg.addColorStop(0.5, "#1e293b");
      bg.addColorStop(1, "#0284c7");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Glass plate
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8, 24);
      ctx.fill();
      ctx.stroke();
    }
  },

  // 24. Architectural Brutalist Concrete
  {
    id: "concrete-brutalist-grey",
    nameAr: "خرسانة معمارية حديثة بملمس ناعم",
    nameEn: "Architectural Brutalist Studio Concrete",
    category: "concrete",
    tags: ["concrete", "cement", "brutalist", "grey", "خرسانة", "إسمنت"],
    accentColor: "#64748b",
    render: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#cbd5e1");
      grad.addColorStop(0.5, "#94a3b8");
      grad.addColorStop(1, "#64748b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Concrete seams
      ctx.strokeStyle = "rgba(51, 65, 85, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 0);
      ctx.lineTo(w * 0.5, h);
      ctx.moveTo(0, h * 0.5);
      ctx.lineTo(w, h * 0.5);
      ctx.stroke();
    }
  },

  // 25. Misty Alpine Mountain Ridge
  {
    id: "mountains-misty-ridge",
    nameAr: "سلسلة جبال الألب مع ضباب شتوي ساحر",
    nameEn: "Misty Alpine Mountain Ridge & Sunbeam",
    category: "mountains",
    tags: ["mountains", "alps", "mist", "nature", "جبال", "ضباب"],
    accentColor: "#0284c7",
    render: (ctx, w, h) => {
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.7);
      sky.addColorStop(0, "#38bdf8");
      sky.addColorStop(1, "#f1f5f9");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Distant mountain
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.moveTo(0, h * 0.65);
      ctx.lineTo(w * 0.35, h * 0.28);
      ctx.lineTo(w * 0.7, h * 0.65);
      ctx.lineTo(0, h * 0.65);
      ctx.fill();

      // Foreground sharp peak
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h);
      ctx.lineTo(w * 0.65, h * 0.38);
      ctx.lineTo(w, h * 0.85);
      ctx.lineTo(w, h);
      ctx.fill();
    }
  },

  // 26. Turquoise Ocean Horizon
  {
    id: "ocean-turquoise-deep",
    nameAr: "أمواج المحيط الفيروزية مع لمعان الشمس",
    nameEn: "Turquoise Deep Ocean Waters & Shimmer",
    category: "ocean",
    tags: ["ocean", "sea", "water", "turquoise", "محيط", "بحر"],
    accentColor: "#06b6d4",
    render: (ctx, w, h) => {
      const sea = ctx.createLinearGradient(0, 0, 0, h);
      sea.addColorStop(0, "#0891b2");
      sea.addColorStop(0.4, "#06b6d4");
      sea.addColorStop(0.8, "#0e7490");
      sea.addColorStop(1, "#164e63");
      ctx.fillStyle = sea;
      ctx.fillRect(0, 0, w, h);

      // Water ripples
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 2;
      for (let y = h * 0.2; y < h; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.25, y - 6, w * 0.75, y + 6, w, y);
        ctx.stroke();
      }
    }
  },

  // 27. Cyberpunk Neo Tokyo Neon
  {
    id: "cyberpunk-neo-tokyo",
    nameAr: "سايبربانك نيو طوكيو مع أضواء نيون أرجوانية",
    nameEn: "Cyberpunk Neo Tokyo Violet & Cyan Neon",
    category: "cyberpunk",
    tags: ["cyberpunk", "neon", "tokyo", "futuristic", "سايبربانك", "نيون"],
    accentColor: "#d946ef",
    render: (ctx, w, h) => {
      ctx.fillStyle = "#05050a";
      ctx.fillRect(0, 0, w, h);

      // Vertical neon streaks
      const grad1 = ctx.createLinearGradient(0, 0, 0, h);
      grad1.addColorStop(0, "transparent");
      grad1.addColorStop(0.5, "#d946ef");
      grad1.addColorStop(1, "transparent");
      ctx.fillStyle = grad1;
      ctx.fillRect(w * 0.2, 0, 6, h);

      const grad2 = ctx.createLinearGradient(0, 0, 0, h);
      grad2.addColorStop(0, "transparent");
      grad2.addColorStop(0.5, "#06b6d4");
      grad2.addColorStop(1, "transparent");
      ctx.fillStyle = grad2;
      ctx.fillRect(w * 0.75, 0, 8, h);

      // Ambient radial bloom
      const bloom = ctx.createRadialGradient(w * 0.5, h * 0.5, 20, w * 0.5, h * 0.5, w * 0.6);
      bloom.addColorStop(0, "rgba(217, 70, 239, 0.22)");
      bloom.addColorStop(1, "transparent");
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, w, h);
    }
  },

  // 28. Soft Pastel Gradients
  {
    id: "gradients-pastel-blush",
    nameAr: "تدرج باستيل وردي وخوخي فائق النعومة",
    nameEn: "Soft Pastel Peach & Lavender Mesh",
    category: "gradients",
    tags: ["gradient", "pastel", "peach", "lavender", "تدرج", "باستيل"],
    accentColor: "#f472b6",
    render: (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#fed7aa");
      grad.addColorStop(0.5, "#fbcfe8");
      grad.addColorStop(1, "#c7d2fe");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  }
];

export const EXPANDED_BACKDROP_THEMES = [
  { id: "all", nameAr: "الكل", nameEn: "All", icon: "✨" },
  { id: "marble", nameAr: "رخام فاخر", nameEn: "Marble", icon: "🏛️" },
  { id: "wood", nameAr: "خشب طبيعي", nameEn: "Wood", icon: "🪵" },
  { id: "gold", nameAr: "ذهب وفخامة", nameEn: "Gold & Luxury", icon: "👑" },
  { id: "glass", nameAr: "زجاج عصري", nameEn: "Glassmorphism", icon: "🪟" },
  { id: "cyberpunk", nameAr: "سايبربانك ونيون", nameEn: "Cyberpunk", icon: "⚡" },
  { id: "gradient", nameAr: "تدرجات لونية", nameEn: "Gradients", icon: "🌈" },
  { id: "studio", nameAr: "استوديو سينمائي", nameEn: "Studio", icon: "🎬" },
  { id: "product", nameAr: "منصات منتجات", nameEn: "Product Podiums", icon: "🛍️" },
  { id: "nature", nameAr: "طبيعة وشمس", nameEn: "Nature", icon: "🌿" },
  { id: "minimal", nameAr: "مينيمال نقي", nameEn: "Minimal", icon: "⚪" },
];
