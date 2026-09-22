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
  // 1. Luxury Marble Podium
  {
    id: "luxury-marble",
    nameAr: "منصة رخام كاريرا فاخرة بعروق ذهبية (Carrara Marble)",
    nameEn: "Luxury Italian Carrara Marble Podium",
    category: "luxury",
    accentColor: "#cbd5e1",
    render: (ctx, w, h) => {
      // Soft high-key warm studio backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "#f8fafc");
      bgGrad.addColorStop(0.55, "#e2e8f0");
      bgGrad.addColorStop(0.85, "#cbd5e1");
      bgGrad.addColorStop(1, "#94a3b8");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Realistic marble veining paths in background
      ctx.save();
      ctx.strokeStyle = "rgba(148, 163, 184, 0.22)";
      ctx.lineWidth = 1.5;
      const drawVein = (sx: number, sy: number, ex: number, ey: number) => {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(sx + (ex - sx) * 0.3, sy - 20, sx + (ex - sx) * 0.7, sy + 30, ex, ey);
        ctx.stroke();
      };
      drawVein(w * 0.05, h * 0.1, w * 0.45, h * 0.5);
      drawVein(w * 0.3, h * 0.05, w * 0.85, h * 0.45);
      drawVein(w * 0.6, h * 0.2, w * 0.95, h * 0.7);

      // Delicate gold leaf inclusions
      ctx.strokeStyle = "rgba(217, 119, 6, 0.25)";
      ctx.lineWidth = 1;
      drawVein(w * 0.1, h * 0.12, w * 0.4, h * 0.48);
      drawVein(w * 0.35, h * 0.08, w * 0.8, h * 0.42);
      ctx.restore();

      // Studio overhead key spotlight
      const spot = ctx.createRadialGradient(w / 2, h * 0.25, 20, w / 2, h * 0.45, w * 0.65);
      spot.addColorStop(0, "rgba(255, 255, 255, 0.85)");
      spot.addColorStop(0.6, "rgba(255, 255, 255, 0.3)");
      spot.addColorStop(1, "transparent");
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, w, h);

      // Ambient Occlusion shadow under podium
      const shadowY = h * 0.82;
      const podW = w * 0.54;
      const podH = h * 0.16;

      const gShadow = ctx.createRadialGradient(w / 2, shadowY + 10, podW * 0.15, w / 2, shadowY + 10, podW * 0.75);
      gShadow.addColorStop(0, "rgba(15, 23, 42, 0.55)");
      gShadow.addColorStop(0.4, "rgba(15, 23, 42, 0.25)");
      gShadow.addColorStop(1, "rgba(15, 23, 42, 0)");
      ctx.fillStyle = gShadow;
      ctx.beginPath();
      ctx.ellipse(w / 2, shadowY + podH * 0.38, podW * 0.68, podH * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3D Cylindrical Marble Podium Base
      const podX = w / 2;
      const podY = h * 0.74;

      // Cylinder body with specular lighting
      const bodyGrad = ctx.createLinearGradient(podX - podW / 2, 0, podX + podW / 2, 0);
      bodyGrad.addColorStop(0, "#cbd5e1");
      bodyGrad.addColorStop(0.2, "#f1f5f9");
      bodyGrad.addColorStop(0.5, "#ffffff");
      bodyGrad.addColorStop(0.8, "#e2e8f0");
      bodyGrad.addColorStop(1, "#94a3b8");
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(podX, podY, podW / 2, podH / 2, 0, 0, Math.PI);
      ctx.lineTo(podX - podW / 2, podY - podH * 0.75);
      ctx.ellipse(podX, podY - podH * 0.75, podW / 2, podH / 2, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // Top polished marble disc
      const topGrad = ctx.createRadialGradient(podX, podY - podH * 0.75 - 10, 10, podX, podY - podH * 0.75, podW / 2);
      topGrad.addColorStop(0, "#ffffff");
      topGrad.addColorStop(0.5, "#f8fafc");
      topGrad.addColorStop(0.85, "#e2e8f0");
      topGrad.addColorStop(1, "#cbd5e1");
      ctx.fillStyle = topGrad;
      ctx.beginPath();
      ctx.ellipse(podX, podY - podH * 0.75, podW / 2, podH / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Polished gold metallic bevel trim
      ctx.strokeStyle = "rgba(217, 119, 6, 0.75)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(podX, podY - podH * 0.75 - 1, (podW / 2) * 0.98, (podH / 2) * 0.98, 0, 0, Math.PI * 2);
      ctx.stroke();
    },
  },

  // 2. Soft Commercial Studio Spotlight
  {
    id: "soft-studio",
    nameAr: "استوديو إعلاني لا نهائي (Commercial Cyclorama)",
    nameEn: "Commercial Cyclorama Studio Spotlight",
    category: "studio",
    accentColor: "#94a3b8",
    render: (ctx, w, h) => {
      // Clean modern infinite studio backdrop
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#1e293b");
      grad.addColorStop(0.5, "#0f172a");
      grad.addColorStop(0.75, "#1e293b");
      grad.addColorStop(1, "#090d16");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Key Softbox light from left
      const leftLight = ctx.createRadialGradient(w * 0.3, h * 0.35, 10, w * 0.35, h * 0.45, w * 0.65);
      leftLight.addColorStop(0, "rgba(56, 189, 248, 0.22)");
      leftLight.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
      leftLight.addColorStop(1, "transparent");
      ctx.fillStyle = leftLight;
      ctx.fillRect(0, 0, w, h);

      // Warm rim light from right
      const rightLight = ctx.createRadialGradient(w * 0.8, h * 0.4, 20, w * 0.75, h * 0.45, w * 0.55);
      rightLight.addColorStop(0, "rgba(251, 191, 36, 0.14)");
      rightLight.addColorStop(1, "transparent");
      ctx.fillStyle = rightLight;
      ctx.fillRect(0, 0, w, h);

      // Studio floor plane horizon
      const floorGrad = ctx.createLinearGradient(0, h * 0.68, 0, h);
      floorGrad.addColorStop(0, "rgba(255, 255, 255, 0.04)");
      floorGrad.addColorStop(0.5, "rgba(15, 23, 42, 0.6)");
      floorGrad.addColorStop(1, "rgba(2, 6, 23, 0.9)");
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, h * 0.68, w, h * 0.32);

      // Studio floor reflection oval
      ctx.fillStyle = "rgba(56, 189, 248, 0.06)";
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.78, w * 0.42, h * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  // 3. Minimal Warm Walnut Wood Table
  {
    id: "minimal-wood",
    nameAr: "خشب جوز طبيعي دافئ مع بوكيه سينمائي (Warm Walnut)",
    nameEn: "Warm Natural Walnut Wood & Cinema Bokeh",
    category: "natural",
    accentColor: "#d97706",
    render: (ctx, w, h) => {
      // Warm atmospheric cafe/interior background
      const bg = ctx.createLinearGradient(0, 0, 0, h * 0.65);
      bg.addColorStop(0, "#2c1810");
      bg.addColorStop(0.6, "#1f110b");
      bg.addColorStop(1, "#150a06");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h * 0.65);

      // Cinema depth-of-field bokeh discs
      const bokehColors = ["rgba(251, 191, 36, 0.18)", "rgba(245, 158, 11, 0.12)", "rgba(254, 240, 138, 0.22)", "rgba(217, 119, 6, 0.15)"];
      const bokehs = [
        { x: w * 0.2, y: h * 0.22, r: 50 },
        { x: w * 0.75, y: h * 0.28, r: 75 },
        { x: w * 0.45, y: h * 0.14, r: 40 },
        { x: w * 0.88, y: h * 0.38, r: 60 },
        { x: w * 0.12, y: h * 0.42, r: 45 },
      ];
      bokehs.forEach((b, i) => {
        ctx.fillStyle = bokehColors[i % bokehColors.length];
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Warm sunlight shaft diagonally across background
      const sunShaft = ctx.createLinearGradient(w * 0.1, 0, w * 0.9, h * 0.65);
      sunShaft.addColorStop(0, "rgba(254, 243, 199, 0.16)");
      sunShaft.addColorStop(0.5, "rgba(251, 191, 36, 0.08)");
      sunShaft.addColorStop(1, "transparent");
      ctx.fillStyle = sunShaft;
      ctx.fillRect(0, 0, w, h * 0.65);

      // Wooden Tabletop (bottom 35%)
      const tableY = h * 0.65;
      const woodGrad = ctx.createLinearGradient(0, tableY, 0, h);
      woodGrad.addColorStop(0, "#854d0e");
      woodGrad.addColorStop(0.08, "#713f12");
      woodGrad.addColorStop(0.4, "#542c0c");
      woodGrad.addColorStop(1, "#361805");
      ctx.fillStyle = woodGrad;
      ctx.fillRect(0, tableY, w, h - tableY);

      // Individual wood plank perspective lines
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.lineWidth = 2;
      for (let x = -w * 0.2; x < w * 1.3; x += w * 0.16) {
        ctx.beginPath();
        ctx.moveTo(x, tableY);
        ctx.lineTo(x + (x - w / 2) * 0.4, h);
        ctx.stroke();
      }

      // Fine woodgrain texture details
      ctx.strokeStyle = "rgba(254, 243, 199, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const gy = tableY + (h - tableY) * (i / 8);
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // Tabletop edge bevel highlight (golden specular reflection)
      ctx.strokeStyle = "rgba(254, 240, 138, 0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, tableY);
      ctx.lineTo(w, tableY);
      ctx.stroke();
    },
  },

  // 4. Cyberpunk Neon Stage
  {
    id: "cyberpunk-neon",
    nameAr: "منصة نيون سايبربانك مستقبلية (Cyberpunk Stage)",
    nameEn: "Futuristic Cyberpunk Neon Grid Stage",
    category: "creative",
    accentColor: "#06b6d4",
    render: (ctx, w, h) => {
      // Dark moody wet sci-fi street environment
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#050811");
      bg.addColorStop(0.65, "#0b1222");
      bg.addColorStop(1, "#020408");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Neon cyan key glow (left)
      const leftGlow = ctx.createRadialGradient(w * 0.1, h * 0.6, 20, w * 0.2, h * 0.65, w * 0.5);
      leftGlow.addColorStop(0, "rgba(6, 182, 212, 0.45)");
      leftGlow.addColorStop(0.6, "rgba(6, 182, 212, 0.12)");
      leftGlow.addColorStop(1, "transparent");
      ctx.fillStyle = leftGlow;
      ctx.fillRect(0, 0, w, h);

      // Neon magenta key glow (right)
      const rightGlow = ctx.createRadialGradient(w * 0.9, h * 0.6, 20, w * 0.8, h * 0.65, w * 0.5);
      rightGlow.addColorStop(0, "rgba(236, 72, 153, 0.4)");
      rightGlow.addColorStop(0.6, "rgba(236, 72, 153, 0.1)");
      rightGlow.addColorStop(1, "transparent");
      ctx.fillStyle = rightGlow;
      ctx.fillRect(0, 0, w, h);

      // Perspective floor grid lines
      ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
      ctx.lineWidth = 1;
      const fStart = h * 0.7;
      for (let x = -w * 0.5; x <= w * 1.5; x += w * 0.12) {
        ctx.beginPath();
        ctx.moveTo(w / 2, fStart);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Floating futuristic hexagonal pedestal
      const podX = w / 2;
      const podY = h * 0.77;
      const podW = w * 0.52;
      const podH = h * 0.15;

      // Glow under podium
      ctx.fillStyle = "rgba(6, 182, 212, 0.3)";
      ctx.beginPath();
      ctx.ellipse(podX, podY + 8, podW * 0.55, podH * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pedestal body
      ctx.fillStyle = "#090d16";
      ctx.beginPath();
      ctx.ellipse(podX, podY, podW / 2, podH / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Neon edge stroke with bright cyan glow
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 20;
      ctx.stroke();

      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(podX, podY, (podW / 2) * 0.88, (podH / 2) * 0.88, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    },
  },

  // 5. Pastel Geometric Architecture
  {
    id: "pastel-geometric",
    nameAr: "استوديو هندسي باستيل ثلاثي الأبعاد (Pastel Studio)",
    nameEn: "Pastel 3D Geometric Architectural Studio",
    category: "creative",
    accentColor: "#f472b6",
    render: (ctx, w, h) => {
      // Soft peach/rose warm studio gradient
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#ffe4e6");
      bg.addColorStop(0.4, "#fed7aa");
      bg.addColorStop(1, "#e0e7ff");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Aesthetic 3D soft geometric forms
      ctx.save();
      ctx.shadowColor = "rgba(244, 114, 182, 0.25)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;

      // Sphere 1 (left)
      const s1Grad = ctx.createRadialGradient(w * 0.2, h * 0.32, 10, w * 0.24, h * 0.36, w * 0.14);
      s1Grad.addColorStop(0, "#ffffff");
      s1Grad.addColorStop(0.4, "#fbcfe8");
      s1Grad.addColorStop(1, "#f472b6");
      ctx.fillStyle = s1Grad;
      ctx.beginPath();
      ctx.arc(w * 0.24, h * 0.36, w * 0.12, 0, Math.PI * 2);
      ctx.fill();

      // Sphere 2 (right)
      const s2Grad = ctx.createRadialGradient(w * 0.76, h * 0.24, 10, w * 0.8, h * 0.28, w * 0.16);
      s2Grad.addColorStop(0, "#ffffff");
      s2Grad.addColorStop(0.4, "#c7d2fe");
      s2Grad.addColorStop(1, "#818cf8");
      ctx.fillStyle = s2Grad;
      ctx.beginPath();
      ctx.arc(w * 0.8, h * 0.28, w * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Modern cylinder pedestal with soft drop shadow
      const podX = w / 2;
      const podY = h * 0.75;
      const podW = w * 0.48;
      const podH = h * 0.15;

      ctx.save();
      ctx.shadowColor = "rgba(148, 163, 184, 0.35)";
      ctx.shadowBlur = 25;
      ctx.shadowOffsetY = 12;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(podX, podY, podW / 2, podH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
  },

  // 6. Royal Dark & Gold Pedestal
  {
    id: "royal-gold",
    nameAr: "منصة ملكية فاخرة من حجر الأوبسيديان والذهب (Royal Obsidian)",
    nameEn: "Royal Obsidian Stone & Gold Pedestal",
    category: "luxury",
    accentColor: "#fbbf24",
    render: (ctx, w, h) => {
      // Deep obsidian dark stone backdrop
      const bg = ctx.createRadialGradient(w / 2, h * 0.4, 20, w / 2, h * 0.5, w * 0.75);
      bg.addColorStop(0, "#1f1d1a");
      bg.addColorStop(0.6, "#0c0a09");
      bg.addColorStop(1, "#030202");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Shimmering gold dust particles simulation
      for (let i = 0; i < 35; i++) {
        const px = (Math.sin(i * 123) * 0.5 + 0.5) * w;
        const py = (Math.cos(i * 47) * 0.5 + 0.5) * h;
        const pr = Math.abs(Math.sin(i * 19)) * 2 + 0.5;
        ctx.fillStyle = i % 2 === 0 ? "rgba(254, 240, 138, 0.55)" : "rgba(245, 158, 11, 0.35)";
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Gold rim spotlight centered on pedestal
      const goldSpot = ctx.createRadialGradient(w / 2, h * 0.74, 10, w / 2, h * 0.74, w * 0.38);
      goldSpot.addColorStop(0, "rgba(251, 191, 36, 0.28)");
      goldSpot.addColorStop(0.7, "rgba(217, 119, 6, 0.08)");
      goldSpot.addColorStop(1, "transparent");
      ctx.fillStyle = goldSpot;
      ctx.fillRect(0, 0, w, h);

      // Heavy Obsidian Stone Pedestal
      const podX = w / 2;
      const podY = h * 0.76;
      const podW = w * 0.5;
      const podH = h * 0.15;

      ctx.fillStyle = "#171513";
      ctx.beginPath();
      ctx.ellipse(podX, podY, podW / 2, podH / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Double gold metallic mirror rim
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 18;
      ctx.stroke();

      ctx.strokeStyle = "rgba(254, 240, 138, 0.8)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(podX, podY, (podW / 2) * 0.94, (podH / 2) * 0.94, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    },
  },

  // 7. Nature Sunlit Botanical Bokeh
  {
    id: "nature-bokeh",
    nameAr: "جدار مشمس بظلال نباتات طبيعية (Sunlit Botanical Gobo)",
    nameEn: "Sunlit Botanical Palm Gobo & Nature Wall",
    category: "natural",
    accentColor: "#22c55e",
    render: (ctx, w, h) => {
      // Warm plaster wall with golden hour sunlight
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#fef3c7");
      bg.addColorStop(0.4, "#fefce8");
      bg.addColorStop(0.8, "#ecfccb");
      bg.addColorStop(1, "#dcfce7");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Realistic botanical monstera & palm shadow silhouettes (Gobo effect)
      ctx.save();
      ctx.fillStyle = "rgba(20, 83, 45, 0.18)";
      const drawLeafShadow = (cx: number, cy: number, rot: number, scale: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.scale(scale, scale);
        ctx.beginPath();
        ctx.ellipse(0, 0, 160, 50, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };
      drawLeafShadow(w * 0.15, h * 0.25, 0.4, w * 0.0012);
      drawLeafShadow(w * 0.25, h * 0.35, 0.7, w * 0.001);
      drawLeafShadow(w * 0.85, h * 0.2, -0.5, w * 0.0015);
      drawLeafShadow(w * 0.78, h * 0.38, -0.8, w * 0.0012);
      ctx.restore();

      // Warm sunlight rays from top right
      const sun = ctx.createRadialGradient(w * 0.9, h * 0.05, 30, w * 0.9, h * 0.05, w * 0.8);
      sun.addColorStop(0, "rgba(254, 240, 138, 0.65)");
      sun.addColorStop(0.5, "rgba(250, 204, 21, 0.18)");
      sun.addColorStop(1, "transparent");
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, w, h);

      // Natural stone pedestal with beveled surface
      const podX = w / 2;
      const podY = h * 0.76;
      const podW = w * 0.52;
      const podH = h * 0.15;

      ctx.save();
      ctx.shadowColor = "rgba(20, 83, 45, 0.2)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(podX, podY, podW / 2, podH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "rgba(134, 239, 172, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    },
  },

  // 8. Reflective Glass & Prismatic Flare
  {
    id: "reflective-glass",
    nameAr: "منصة زجاجية عاكسة بتشتت ضوئي لوني (Prismatic Glass)",
    nameEn: "Prismatic Caustics & Reflective Glass Pedestal",
    category: "studio",
    accentColor: "#38bdf8",
    render: (ctx, w, h) => {
      // Sleek monochromatic slate backdrop
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#0b1329");
      bg.addColorStop(0.65, "#152238");
      bg.addColorStop(1, "#080d1a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Prismatic iridescent rainbow caustic flare
      const prismGrad = ctx.createLinearGradient(w * 0.2, h * 0.2, w * 0.8, h * 0.5);
      prismGrad.addColorStop(0, "rgba(239, 68, 68, 0.12)");
      prismGrad.addColorStop(0.25, "rgba(245, 158, 11, 0.12)");
      prismGrad.addColorStop(0.5, "rgba(16, 185, 129, 0.12)");
      prismGrad.addColorStop(0.75, "rgba(59, 130, 246, 0.12)");
      prismGrad.addColorStop(1, "rgba(168, 85, 247, 0.12)");
      ctx.fillStyle = prismGrad;
      ctx.fillRect(0, 0, w, h);

      // Overhead cool key spotlight
      const spot = ctx.createRadialGradient(w / 2, h * 0.25, 20, w / 2, h * 0.4, w * 0.55);
      spot.addColorStop(0, "rgba(224, 242, 254, 0.35)");
      spot.addColorStop(1, "transparent");
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, w, h);

      // Translucent glass platform
      const podX = w / 2;
      const podY = h * 0.75;
      const podW = w * 0.54;
      const podH = h * 0.15;

      const glassGrad = ctx.createLinearGradient(0, podY - podH / 2, 0, podY + podH / 2);
      glassGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
      glassGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.2)");
      glassGrad.addColorStop(1, "rgba(255, 255, 255, 0.08)");

      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.ellipse(podX, podY, podW / 2, podH / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 2;
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

