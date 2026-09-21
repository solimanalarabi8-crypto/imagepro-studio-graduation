/**
 * ImagePro Studio — Creative Backdrops Catalog (12 High-Definition Categories)
 * Procedural & Commercial Canvas Renderers with High-Fidelity Lighting & Shadows
 */

export type BackdropCategory =
  | "product"
  | "studio"
  | "luxury"
  | "nature"
  | "technology"
  | "food"
  | "fashion"
  | "beauty"
  | "business"
  | "abstract"
  | "3d"
  | "minimal";

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
  { id: "all", nameAr: "الكل", nameEn: "All", icon: "✨" },
  { id: "product", nameAr: "منتجات", nameEn: "Product", icon: "🛍️" },
  { id: "studio", nameAr: "استوديو", nameEn: "Studio", icon: "🎬" },
  { id: "luxury", nameAr: "فخامة ورخام", nameEn: "Luxury", icon: "💎" },
  { id: "nature", nameAr: "طبيعة وشمس", nameEn: "Nature", icon: "🌿" },
  { id: "technology", nameAr: "تقنية ونيون", nameEn: "Technology", icon: "⚡" },
  { id: "food", nameAr: "مأكولات ومقاهي", nameEn: "Food", icon: "☕" },
  { id: "fashion", nameAr: "أزياء وموضة", nameEn: "Fashion", icon: "👗" },
  { id: "beauty", nameAr: "عناية وجمال", nameEn: "Beauty", icon: "💄" },
  { id: "business", nameAr: "أعمال وشركات", nameEn: "Business", icon: "💼" },
  { id: "abstract", nameAr: "تجريدي سائل", nameEn: "Abstract", icon: "🎨" },
  { id: "3d", nameAr: "منصات ثلاثية الأبعاد", nameEn: "3D Podium", icon: "📦" },
  { id: "minimal", nameAr: "مينيمال نقي", nameEn: "Minimal", icon: "⚪" },
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
];
