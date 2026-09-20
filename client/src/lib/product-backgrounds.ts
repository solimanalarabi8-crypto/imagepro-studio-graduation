/**
 * Product Showcase Backgrounds Engine
 * High-definition procedural studio backdrops for commercial product presentation
 */

export interface ProductBackgroundPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  category: "luxury" | "studio" | "natural" | "creative";
  accentColor: string;
  render: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export const PRODUCT_BACKGROUNDS: ProductBackgroundPreset[] = [
  {
    id: "luxury-marble",
    nameAr: "منصة رخام فاخرة (Marble Podium)",
    nameEn: "Luxury Marble Podium",
    category: "luxury",
    accentColor: "#cbd5e1",
    render: (ctx, w, h) => {
      // Background gradient (soft warm grey studio)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "#eceef0");
      bgGrad.addColorStop(0.65, "#d6dade");
      bgGrad.addColorStop(1, "#b8bec4");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Spotlight from top center
      const spot = ctx.createRadialGradient(w / 2, h * 0.25, 10, w / 2, h * 0.45, w * 0.65);
      spot.addColorStop(0, "rgba(255, 255, 255, 0.65)");
      spot.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, w, h);

      // Ground shadow under podium
      const shadowY = h * 0.82;
      const podW = w * 0.52;
      const podH = h * 0.16;

      const gShadow = ctx.createRadialGradient(w / 2, shadowY, podW * 0.2, w / 2, shadowY, podW * 0.7);
      gShadow.addColorStop(0, "rgba(25, 30, 36, 0.45)");
      gShadow.addColorStop(1, "rgba(25, 30, 36, 0)");
      ctx.fillStyle = gShadow;
      ctx.beginPath();
      ctx.ellipse(w / 2, shadowY + podH * 0.4, podW * 0.65, podH * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cylindrical Marble Podium (Base)
      const podX = w / 2;
      const podY = h * 0.74;

      // Cylinder body
      ctx.fillStyle = "#e2e6ea";
      ctx.beginPath();
      ctx.ellipse(podX, podY, podW / 2, podH / 2, 0, 0, Math.PI);
      ctx.lineTo(podX - podW / 2, podY - podH * 0.8);
      ctx.ellipse(podX, podY - podH * 0.8, podW / 2, podH / 2, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // Top ellipse
      const topGrad = ctx.createRadialGradient(podX, podY - podH * 0.8, 10, podX, podY - podH * 0.8, podW / 2);
      topGrad.addColorStop(0, "#ffffff");
      topGrad.addColorStop(0.7, "#e8ecf0");
      topGrad.addColorStop(1, "#cfd5dc");
      ctx.fillStyle = topGrad;
      ctx.beginPath();
      ctx.ellipse(podX, podY - podH * 0.8, podW / 2, podH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    },
  },
  {
    id: "soft-studio",
    nameAr: "استوديو إعلاني ناعم (Soft Spotlight)",
    nameEn: "Soft Studio Spotlight",
    category: "studio",
    accentColor: "#94a3b8",
    render: (ctx, w, h) => {
      // Clean high-end grey commercial infinity studio
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#2c3437");
      grad.addColorStop(0.65, "#1f2628");
      grad.addColorStop(1, "#14191a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Studio key light
      const keyLight = ctx.createRadialGradient(w / 2, h * 0.35, 20, w / 2, h * 0.5, w * 0.6);
      keyLight.addColorStop(0, "rgba(45, 212, 191, 0.16)");
      keyLight.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
      keyLight.addColorStop(1, "transparent");
      ctx.fillStyle = keyLight;
      ctx.fillRect(0, 0, w, h);

      // Floor plane reflection line
      const floorGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
      floorGrad.addColorStop(0, "rgba(255, 255, 255, 0.05)");
      floorGrad.addColorStop(1, "rgba(0, 0, 0, 0.4)");
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, h * 0.7, w, h * 0.3);

      // Floor highlight ellipse
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.78, w * 0.35, h * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  {
    id: "minimal-wood",
    nameAr: "طاولة خشبية دافئة (Wooden Table)",
    nameEn: "Minimal Wooden Table",
    category: "natural",
    accentColor: "#d97706",
    render: (ctx, w, h) => {
      // Warm indoor background with bokeh
      const bg = ctx.createLinearGradient(0, 0, 0, h * 0.65);
      bg.addColorStop(0, "#3a2e26");
      bg.addColorStop(1, "#261c16");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h * 0.65);

      // Warm ambient bokeh circles
      const bokehColors = ["rgba(251, 191, 36, 0.12)", "rgba(245, 158, 11, 0.08)", "rgba(253, 230, 138, 0.15)"];
      const bokehs = [
        { x: w * 0.25, y: h * 0.25, r: 45 },
        { x: w * 0.72, y: h * 0.32, r: 60 },
        { x: w * 0.48, y: h * 0.18, r: 35 },
        { x: w * 0.85, y: h * 0.42, r: 50 },
      ];
      bokehs.forEach((b, i) => {
        ctx.fillStyle = bokehColors[i % bokehColors.length];
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Wooden Tabletop (bottom 35%)
      const tableY = h * 0.65;
      const woodGrad = ctx.createLinearGradient(0, tableY, 0, h);
      woodGrad.addColorStop(0, "#b46a36");
      woodGrad.addColorStop(0.1, "#944e24");
      woodGrad.addColorStop(0.5, "#6e3314");
      woodGrad.addColorStop(1, "#441d08");
      ctx.fillStyle = woodGrad;
      ctx.fillRect(0, tableY, w, h - tableY);

      // Wooden planks / grain lines
      ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
      ctx.lineWidth = 2;
      for (let x = -w * 0.2; x < w * 1.2; x += w * 0.18) {
        ctx.beginPath();
        ctx.moveTo(x, tableY);
        ctx.lineTo(x + (x - w / 2) * 0.35, h);
        ctx.stroke();
      }

      // Edge bevel highlight
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, tableY);
      ctx.lineTo(w, tableY);
      ctx.stroke();
    },
  },
  {
    id: "cyberpunk-neon",
    nameAr: "منصة نيون مستقبلية (Neon Cyberpunk)",
    nameEn: "Cyberpunk Neon Stage",
    category: "creative",
    accentColor: "#06b6d4",
    render: (ctx, w, h) => {
      // Dark futuristic atmospheric backdrop
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#080c14");
      bg.addColorStop(0.65, "#0b1220");
      bg.addColorStop(1, "#03060a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Cyan / Magenta neon glow lines
      const leftGlow = ctx.createRadialGradient(w * 0.15, h * 0.65, 10, w * 0.15, h * 0.65, w * 0.45);
      leftGlow.addColorStop(0, "rgba(6, 182, 212, 0.32)");
      leftGlow.addColorStop(1, "transparent");
      ctx.fillStyle = leftGlow;
      ctx.fillRect(0, 0, w, h);

      const rightGlow = ctx.createRadialGradient(w * 0.85, h * 0.65, 10, w * 0.85, h * 0.65, w * 0.45);
      rightGlow.addColorStop(0, "rgba(236, 72, 153, 0.28)");
      rightGlow.addColorStop(1, "transparent");
      ctx.fillStyle = rightGlow;
      ctx.fillRect(0, 0, w, h);

      // Futuristic pedestal
      const podX = w / 2;
      const podY = h * 0.76;
      const podW = w * 0.48;
      const podH = h * 0.14;

      // Glowing edge ring
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(podX, podY, podW / 2, podH / 2, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.fill();
      ctx.shadowBlur = 0;
    },
  },
  {
    id: "pastel-geometric",
    nameAr: "منصة باستيل عصرية (Pastel Studio)",
    nameEn: "Pastel Geometric Studio",
    category: "creative",
    accentColor: "#f472b6",
    render: (ctx, w, h) => {
      // Soft modern pastel gradient
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#ffe4e6");
      bg.addColorStop(0.5, "#fed7aa");
      bg.addColorStop(1, "#e0e7ff");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Aesthetic pastel spheres in background
      ctx.fillStyle = "rgba(244, 114, 182, 0.25)";
      ctx.beginPath();
      ctx.arc(w * 0.22, h * 0.35, w * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(129, 140, 248, 0.22)";
      ctx.beginPath();
      ctx.arc(w * 0.78, h * 0.28, w * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Clean cylinder pedestal
      const podX = w / 2;
      const podY = h * 0.75;
      const podW = w * 0.46;
      const podH = h * 0.14;

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(podX, podY, podW / 2, podH / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
  },
  {
    id: "royal-gold",
    nameAr: "منصة ملكية داكنة (Royal Gold)",
    nameEn: "Royal Dark & Gold Pedestal",
    category: "luxury",
    accentColor: "#fbbf24",
    render: (ctx, w, h) => {
      // Deep dramatic black backdrop
      const bg = ctx.createRadialGradient(w / 2, h * 0.4, 30, w / 2, h * 0.5, w * 0.7);
      bg.addColorStop(0, "#1c1917");
      bg.addColorStop(1, "#0c0a09");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Gold rim spotlight
      const goldSpot = ctx.createRadialGradient(w / 2, h * 0.72, 10, w / 2, h * 0.72, w * 0.35);
      goldSpot.addColorStop(0, "rgba(251, 191, 36, 0.22)");
      goldSpot.addColorStop(1, "transparent");
      ctx.fillStyle = goldSpot;
      ctx.fillRect(0, 0, w, h);

      // Gold Pedestal
      const podX = w / 2;
      const podY = h * 0.76;
      const podW = w * 0.46;
      const podH = h * 0.13;

      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.ellipse(podX, podY, podW / 2, podH / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Double gold border
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.shadowBlur = 0;
    },
  },
  {
    id: "nature-bokeh",
    nameAr: "طبيعة مشمسة وبوكيه (Nature Bokeh)",
    nameEn: "Nature Sunlit Bokeh",
    category: "natural",
    accentColor: "#22c55e",
    render: (ctx, w, h) => {
      // Organic warm greenery gradient
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#14532d");
      bg.addColorStop(0.4, "#166534");
      bg.addColorStop(0.75, "#15803d");
      bg.addColorStop(1, "#14532d");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Warm sunlight rays from top right
      const sun = ctx.createRadialGradient(w * 0.85, h * 0.1, 20, w * 0.85, h * 0.1, w * 0.7);
      sun.addColorStop(0, "rgba(254, 240, 138, 0.55)");
      sun.addColorStop(0.5, "rgba(250, 204, 21, 0.2)");
      sun.addColorStop(1, "transparent");
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, w, h);

      // Natural bokeh circles
      const bokehLeaves = [
        { x: w * 0.15, y: h * 0.2, r: 40 },
        { x: w * 0.35, y: h * 0.35, r: 60 },
        { x: w * 0.65, y: h * 0.25, r: 50 },
        { x: w * 0.88, y: h * 0.45, r: 70 },
      ];
      bokehLeaves.forEach((b) => {
        ctx.fillStyle = "rgba(187, 247, 208, 0.18)";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Natural stone pedestal
      const podX = w / 2;
      const podY = h * 0.77;
      const podW = w * 0.5;
      const podH = h * 0.14;

      ctx.fillStyle = "#3f3f46";
      ctx.beginPath();
      ctx.ellipse(podX, podY, podW / 2, podH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.stroke();
    },
  },
  {
    id: "reflective-glass",
    nameAr: "منصة زجاجية عاكسة (Reflective Glass)",
    nameEn: "Reflective Glass Pedestal",
    category: "studio",
    accentColor: "#38bdf8",
    render: (ctx, w, h) => {
      // Sleek monochromatic commercial studio
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#0f172a");
      bg.addColorStop(0.65, "#1e293b");
      bg.addColorStop(1, "#0f172a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Cyan accent overhead
      const spot = ctx.createRadialGradient(w / 2, h * 0.2, 10, w / 2, h * 0.35, w * 0.55);
      spot.addColorStop(0, "rgba(56, 189, 248, 0.22)");
      spot.addColorStop(1, "transparent");
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, w, h);

      // Glass sheet platform
      const podX = w / 2;
      const podY = h * 0.75;
      const podW = w * 0.52;
      const podH = h * 0.14;

      // Reflection gradient
      const glassGrad = ctx.createLinearGradient(0, podY - podH / 2, 0, podY + podH / 2);
      glassGrad.addColorStop(0, "rgba(255, 255, 255, 0.35)");
      glassGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.15)");
      glassGrad.addColorStop(1, "rgba(255, 255, 255, 0.05)");

      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.ellipse(podX, podY, podW / 2, podH / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    },
  },
];

/**
 * Generate a complete data URL image for a given product preset and dimensions
 */
export function generateProductBackgroundUrl(presetId: string, width = 1920, height = 1080): string {
  const preset = PRODUCT_BACKGROUNDS.find((p) => p.id === presetId) || PRODUCT_BACKGROUNDS[0];
  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext("2d");
  if (ctx) {
    preset.render(ctx, width, height);
  }
  return offscreen.toDataURL("image/png");
}
