/**
 * ImagePro Studio — Creative Assets Library
 * Vector Shapes, Badges, Icons, 3D Elements, Frames, Stickers, Patterns & Illustrations
 */

export type AssetCategory =
  | "icons"
  | "shapes"
  | "frames"
  | "stickers"
  | "illustrations"
  | "badges"
  | "arrows"
  | "patterns"
  | "gradients"
  | "3d"
  | "decorative";

export interface AssetGraphicItem {
  id: string;
  nameAr: string;
  nameEn: string;
  category: AssetCategory;
  tags: string[];
  render: (ctx: CanvasRenderingContext2D, size: number, color?: string) => void;
  defaultWidth: number;
  defaultHeight: number;
}

export const ASSET_CATEGORIES: { id: "all" | AssetCategory; nameAr: string; nameEn: string; icon: string }[] = [
  { id: "all", nameAr: "كافة الأصول", nameEn: "All Assets", icon: "✨" },
  { id: "icons", nameAr: "أيقونات", nameEn: "Icons", icon: "⭐" },
  { id: "shapes", nameAr: "أشكال هندسية", nameEn: "Shapes", icon: "🔷" },
  { id: "frames", nameAr: "إطارات وبراويز", nameEn: "Frames", icon: "🖼️" },
  { id: "stickers", nameAr: "ملصقات وستكرات", nameEn: "Stickers", icon: "🎯" },
  { id: "illustrations", nameAr: "رسومات وعناصر", nameEn: "Illustrations", icon: "🎨" },
  { id: "badges", nameAr: "شارات وأختام", nameEn: "Badges & Seals", icon: "🏷️" },
  { id: "arrows", nameAr: "أسهم ومؤشرات", nameEn: "Arrows", icon: "↗️" },
  { id: "patterns", nameAr: "أنماط وزخارف", nameEn: "Patterns", icon: "🏁" },
  { id: "gradients", nameAr: "تدرجات لونية", nameEn: "Gradients", icon: "🌈" },
  { id: "3d", nameAr: "مجسمات 3D", nameEn: "3D Elements", icon: "📦" },
  { id: "decorative", nameAr: "زخارف ولمسات", nameEn: "Decorative Elements", icon: "⚜️" },
];

export const ASSET_GRAPHICS: AssetGraphicItem[] = [
  // 1. Star Badge 5-point
  {
    id: "shape-gold-star",
    nameAr: "نجمة ذهبية لامعة",
    nameEn: "Golden Five-Point Star",
    category: "shapes",
    tags: ["star", "gold", "rating", "نجمة"],
    defaultWidth: 160,
    defaultHeight: 160,
    render: (ctx, s, color = "#f59e0b") => {
      ctx.save();
      ctx.translate(s / 2, s / 2);
      ctx.fillStyle = color;
      ctx.beginPath();
      const points = 5;
      const outerRadius = s * 0.45;
      const innerRadius = s * 0.2;
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  },

  // 2. Verified Seal Badge
  {
    id: "badge-verified-seal",
    nameAr: "ختم الجودة المعتمد (Verified)",
    nameEn: "Verified Certification Seal",
    category: "badges",
    tags: ["verified", "seal", "trust", "ختم"],
    defaultWidth: 180,
    defaultHeight: 180,
    render: (ctx, s, color = "#0284c7") => {
      ctx.save();
      ctx.translate(s / 2, s / 2);
      ctx.fillStyle = color;
      ctx.beginPath();
      const teeth = 16;
      for (let i = 0; i < teeth * 2; i++) {
        const r = i % 2 === 0 ? s * 0.45 : s * 0.38;
        const a = (i * Math.PI) / teeth;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Inner white checkmark
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = s * 0.07;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-s * 0.15, 0);
      ctx.lineTo(-s * 0.03, s * 0.12);
      ctx.lineTo(s * 0.18, -s * 0.12);
      ctx.stroke();
      ctx.restore();
    }
  },

  // 3. Discount Ribbon 50%
  {
    id: "comm-discount-ribbon",
    nameAr: "شريط خصم 50% ترويجي",
    nameEn: "Flash 50% Off Discount Ribbon",
    category: "commerce",
    tags: ["sale", "discount", "badge", "خصم"],
    defaultWidth: 220,
    defaultHeight: 80,
    render: (ctx, s, color = "#ef4444") => {
      ctx.save();
      ctx.translate(s / 2, s / 2);
      ctx.fillStyle = color;
      const w = s * 0.9;
      const h = s * 0.38;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 8);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(s * 0.14)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("50% OFF", 0, 0);
      ctx.restore();
    }
  },

  // 4. Dynamic Modern Arrow
  {
    id: "arrow-diagonal-bold",
    nameAr: "سهم انطلاق قطري عصري",
    nameEn: "Dynamic Slanted Arrow",
    category: "arrows",
    tags: ["arrow", "pointer", "next", "سهم"],
    defaultWidth: 150,
    defaultHeight: 150,
    render: (ctx, s, color = "#10b981") => {
      ctx.save();
      ctx.translate(s / 2, s / 2);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = s * 0.08;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(-s * 0.28, s * 0.28);
      ctx.lineTo(s * 0.25, -s * 0.25);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(s * 0.05, -s * 0.25);
      ctx.lineTo(s * 0.25, -s * 0.25);
      ctx.lineTo(s * 0.25, -s * 0.05);
      ctx.stroke();
      ctx.restore();
    }
  },

  // 5. Hexagon Outline
  {
    id: "shape-clean-hexagon",
    nameAr: "مضلع سداسي دقيق",
    nameEn: "Geometric Hexagon Frame",
    category: "shapes",
    tags: ["hexagon", "polygon", "frame", "سداسي"],
    defaultWidth: 180,
    defaultHeight: 180,
    render: (ctx, s, color = "#6366f1") => {
      ctx.save();
      ctx.translate(s / 2, s / 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      const sides = 6;
      const radius = s * 0.42;
      for (let i = 0; i < sides; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 6;
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  },

  // 6. Best Choice Laurel Wreath
  {
    id: "badge-laurel-wreath",
    nameAr: "إكليل النصر والاختيار الأفضل",
    nameEn: "Best Choice Award Laurel",
    category: "badges",
    tags: ["award", "laurel", "trophy", "جائزة"],
    defaultWidth: 200,
    defaultHeight: 180,
    render: (ctx, s, color = "#fbbf24") => {
      ctx.save();
      ctx.translate(s / 2, s / 2);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(-s * 0.05, 0, s * 0.35, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(s * 0.05, 0, s * 0.35, Math.PI * 1.5, Math.PI * 0.5);
      ctx.stroke();

      ctx.font = `bold ${Math.round(s * 0.11)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("BEST", 0, -s * 0.06);
      ctx.fillText("CHOICE", 0, s * 0.08);
      ctx.restore();
    }
  },

  // 7. Crown Icon
  {
    id: "icon-royal-crown",
    nameAr: "تاج ملكي ذهبي فاخر",
    nameEn: "Royal Gold Crown Icon",
    category: "icons",
    tags: ["crown", "royal", "vip", "gold", "تاج", "ملكي"],
    defaultWidth: 180,
    defaultHeight: 140,
    render: (ctx, s, color = "#f59e0b") => {
      ctx.save();
      ctx.translate(s / 2, s / 2);
      ctx.fillStyle = color;

      // Crown points
      ctx.beginPath();
      ctx.moveTo(-s * 0.38, s * 0.25);
      ctx.lineTo(-s * 0.42, -s * 0.15);
      ctx.lineTo(-s * 0.18, 0);
      ctx.lineTo(0, -s * 0.3);
      ctx.lineTo(s * 0.18, 0);
      ctx.lineTo(s * 0.42, -s * 0.15);
      ctx.lineTo(s * 0.38, s * 0.25);
      ctx.closePath();
      ctx.fill();

      // Jewels on points
      ctx.fillStyle = "#ffffff";
      [-s * 0.42, 0, s * 0.42].forEach((x, i) => {
        const y = i === 1 ? -s * 0.3 : -s * 0.15;
        ctx.beginPath();
        ctx.arc(x, y, s * 0.045, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
  },

  // 8. Fire / Hot Deal Sticker
  {
    id: "sticker-hot-fire",
    nameAr: "شعلة نارية (عرض ساخن)",
    nameEn: "Hot Deal Flame Flame Sticker",
    category: "stickers",
    tags: ["fire", "flame", "hot", "deal", "شعلة", "نار"],
    defaultWidth: 160,
    defaultHeight: 180,
    render: (ctx, s) => {
      ctx.save();
      ctx.translate(s / 2, s / 2);

      // Outer orange flame
      ctx.fillStyle = "#ea580c";
      ctx.beginPath();
      ctx.moveTo(0, s * 0.38);
      ctx.bezierCurveTo(-s * 0.35, s * 0.35, -s * 0.35, -s * 0.05, -s * 0.1, -s * 0.38);
      ctx.bezierCurveTo(0, -s * 0.15, s * 0.15, -s * 0.22, s * 0.25, -s * 0.35);
      ctx.bezierCurveTo(s * 0.4, -s * 0.05, s * 0.35, s * 0.35, 0, s * 0.38);
      ctx.fill();

      // Inner yellow flame
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.moveTo(0, s * 0.32);
      ctx.bezierCurveTo(-s * 0.2, s * 0.28, -s * 0.2, 0, -s * 0.05, -s * 0.18);
      ctx.bezierCurveTo(0, -s * 0.05, s * 0.1, -s * 0.1, s * 0.15, -s * 0.18);
      ctx.bezierCurveTo(s * 0.22, 0, s * 0.2, s * 0.28, 0, s * 0.32);
      ctx.fill();
      ctx.restore();
    }
  },

  // 9. Polaroid Frame
  {
    id: "frame-polaroid-classic",
    nameAr: "إطار بولارويد فوري أبيض",
    nameEn: "Classic Polaroid Photo Frame",
    category: "frames",
    tags: ["frame", "polaroid", "photo", "border", "إطار", "بولارويد"],
    defaultWidth: 240,
    defaultHeight: 280,
    render: (ctx, s) => {
      ctx.save();
      ctx.translate(s / 2, s / 2);
      const w = s * 0.8;
      const h = s * 0.95;

      // Drop shadow
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.roundRect(-w / 2 + 5, -h / 2 + 8, w, h, 6);
      ctx.fill();

      // White paper frame
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 6);
      ctx.fill();

      // Inner cutout area
      const innerW = w * 0.84;
      const innerH = h * 0.68;
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-innerW / 2, -h / 2 + h * 0.08, innerW, innerH);
      ctx.restore();
    }
  },

  // 10. 3D Glossy Sphere
  {
    id: "3d-glossy-sphere",
    nameAr: "كرة زجاجية ثلاثية الأبعاد بلمعان عالي",
    nameEn: "3D Glossy Gradient Sphere",
    category: "3d",
    tags: ["3d", "sphere", "glossy", "gradient", "مجسم", "كرة"],
    defaultWidth: 180,
    defaultHeight: 180,
    render: (ctx, s, color = "#06b6d4") => {
      ctx.save();
      ctx.translate(s / 2, s / 2);
      const r = s * 0.42;

      // Radial 3D shading
      const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.05, 0, 0, r);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.2, color);
      grad.addColorStop(0.7, "#0f172a");
      grad.addColorStop(1, "#020617");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Highlight oval
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.2, r * 0.12, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },

  // 11. Dot Matrix Pattern
  {
    id: "pattern-dot-matrix",
    nameAr: "شبكة نقاط تصميم عصرية (Dot Matrix)",
    nameEn: "Modern Design Dot Matrix Pattern",
    category: "patterns",
    tags: ["pattern", "dots", "matrix", "grid", "نقاط", "زخرفة"],
    defaultWidth: 200,
    defaultHeight: 200,
    render: (ctx, s, color = "#2dd4bf") => {
      ctx.save();
      ctx.translate(s / 2, s / 2);
      ctx.fillStyle = color;
      const rows = 5;
      const cols = 5;
      const step = (s * 0.7) / (cols - 1);
      const start = -(s * 0.35);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.beginPath();
          ctx.arc(start + c * step, start + r * step, s * 0.025, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  },

  // 12. Floating Speech Bubble
  {
    id: "illus-speech-bubble",
    nameAr: "فقاعة محادثة كرتونية مبهجة",
    nameEn: "Vibrant Chat Speech Bubble",
    category: "illustrations",
    tags: ["bubble", "chat", "talk", "dialog", "فقاعة", "محادثة"],
    defaultWidth: 200,
    defaultHeight: 160,
    render: (ctx, s, color = "#8b5cf6") => {
      ctx.save();
      ctx.translate(s / 2, s / 2);
      ctx.fillStyle = color;

      const w = s * 0.78;
      const h = s * 0.52;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 14);
      ctx.fill();

      // Tail
      ctx.beginPath();
      ctx.moveTo(-w * 0.2, h / 2);
      ctx.lineTo(-w * 0.35, h / 2 + s * 0.18);
      ctx.lineTo(-w * 0.05, h / 2);
      ctx.closePath();
      ctx.fill();

      // 3 dots inside
      ctx.fillStyle = "#ffffff";
      [-w * 0.2, 0, w * 0.2].forEach((x) => {
        ctx.beginPath();
        ctx.arc(x, 0, s * 0.035, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
  },

  // 13. Holographic Gradient Orb
  {
    id: "grad-holographic-orb",
    nameAr: "كرة تدرج هولوجرافيك ضوئية",
    nameEn: "Holographic Gradient Orb",
    category: "gradients",
    tags: ["gradient", "orb", "holographic", "sphere", "تدرج", "كرة"],
    defaultWidth: 160,
    defaultHeight: 160,
    render: (ctx, s) => {
      ctx.save();
      const r = s * 0.42;
      const grad = ctx.createRadialGradient(s * 0.38, s * 0.38, r * 0.1, s * 0.5, s * 0.5, r);
      grad.addColorStop(0, "#f472b6");
      grad.addColorStop(0.4, "#818cf8");
      grad.addColorStop(0.8, "#38bdf8");
      grad.addColorStop(1, "#34d399");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },

  // 14. Luxury Golden Sparkles Burst
  {
    id: "decor-golden-sparkles",
    nameAr: "بريق ولمعان ذهبي متألق",
    nameEn: "Golden Sparkles Starburst",
    category: "decorative",
    tags: ["sparkle", "gold", "stars", "luxury", "بريق", "لمعان", "ذهب"],
    defaultWidth: 140,
    defaultHeight: 140,
    render: (ctx, s) => {
      ctx.save();
      ctx.translate(s / 2, s / 2);
      ctx.fillStyle = "#fbbf24";

      // 4-pointed star
      ctx.beginPath();
      const outer = s * 0.45;
      const inner = s * 0.08;
      for (let i = 0; i < 8; i++) {
        const rad = (i * Math.PI) / 4;
        const dist = i % 2 === 0 ? outer : inner;
        const x = Math.cos(rad) * dist;
        const y = Math.sin(rad) * dist;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Mini corner stars
      ctx.fillStyle = "#fef08a";
      [
        { x: -s * 0.28, y: -s * 0.28, r: s * 0.08 },
        { x: s * 0.28, y: s * 0.28, r: s * 0.06 },
      ].forEach((st) => {
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }
  },

  // 15. Baroque Laurel Leaves Flourish
  {
    id: "decor-laurel-flourish",
    nameAr: "زخرفة أوراق الغار الملكية",
    nameEn: "Royal Laurel Wreath Flourish",
    category: "decorative",
    tags: ["laurel", "wreath", "baroque", "royal", "غار", "ملكي"],
    defaultWidth: 160,
    defaultHeight: 160,
    render: (ctx, s, color = "#eab308") => {
      ctx.save();
      ctx.translate(s / 2, s / 2);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.arc(0, 0, s * 0.35, Math.PI * 0.3, Math.PI * 1.7);
      ctx.stroke();

      // Leaves
      for (let a = Math.PI * 0.4; a < Math.PI * 1.6; a += 0.3) {
        const lx = Math.cos(a) * (s * 0.35);
        const ly = Math.sin(a) * (s * 0.35);
        ctx.beginPath();
        ctx.ellipse(lx + Math.cos(a + 0.5) * 10, ly + Math.sin(a + 0.5) * 10, 8, 4, a + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
];
