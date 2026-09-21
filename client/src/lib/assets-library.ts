/**
 * ImagePro Studio — User Assets Library
 * Vector Shapes, Badges, Icons, Typography Presets & Drag-and-Drop Elements
 */

export interface AssetGraphicItem {
  id: string;
  nameAr: string;
  nameEn: string;
  category: "shapes" | "badges" | "commerce" | "arrows" | "text-presets";
  tags: string[];
  render: (ctx: CanvasRenderingContext2D, size: number, color?: string) => void;
  defaultWidth: number;
  defaultHeight: number;
}

export const ASSET_CATEGORIES: { id: "all" | "shapes" | "badges" | "commerce" | "arrows" | "text-presets"; nameAr: string; nameEn: string; icon: string }[] = [
  { id: "all", nameAr: "كافة الأصول", nameEn: "All Assets", icon: "✨" },
  { id: "shapes", nameAr: "أشكال هندسية", nameEn: "Geometric Shapes", icon: "🔷" },
  { id: "badges", nameAr: "شارات وأختام", nameEn: "Badges & Seals", icon: "🏷️" },
  { id: "commerce", nameAr: "تجارة وعروض", nameEn: "Commerce & Sales", icon: "🛍️" },
  { id: "arrows", nameAr: "أسهم ومؤشرات", nameEn: "Arrows & Pointers", icon: "↗️" },
  { id: "text-presets", nameAr: "أنماط نصوص جاهزة", nameEn: "Text Presets", icon: "✍️" },
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
    nameEn: "50% Off Discount Ribbon",
    category: "commerce",
    tags: ["discount", "sale", "ribbon", "خصم"],
    defaultWidth: 200,
    defaultHeight: 80,
    render: (ctx, s, color = "#ef4444") => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(s * 0.05, s * 0.2, s * 0.9, s * 0.6, 12);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(s * 0.24)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("خصم 50%", s / 2, s * 0.5);
      ctx.restore();
    }
  },

  // 4. Gradient Trend Arrow
  {
    id: "arrow-growth-trend",
    nameAr: "سهم صعود ونمو تجاري",
    nameEn: "Upward Growth Trend Arrow",
    category: "arrows",
    tags: ["arrow", "growth", "trend", "سهم"],
    defaultWidth: 150,
    defaultHeight: 150,
    render: (ctx, s, color = "#10b981") => {
      ctx.save();
      ctx.translate(s / 2, s / 2);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = s * 0.1;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(-s * 0.3, s * 0.3);
      ctx.lineTo(s * 0.25, -s * 0.25);
      ctx.stroke();

      // Arrow head
      ctx.beginPath();
      ctx.moveTo(s * 0.25, -s * 0.25);
      ctx.lineTo(0, -s * 0.25);
      ctx.lineTo(s * 0.25, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  },

  // 5. Hexagon Modern Frame
  {
    id: "shape-modern-hexagon",
    nameAr: "إطار سداسي عصري",
    nameEn: "Modern Hexagonal Frame",
    category: "shapes",
    tags: ["hexagon", "frame", "geometric", "سداسي"],
    defaultWidth: 180,
    defaultHeight: 180,
    render: (ctx, s, color = "#2dd4bf") => {
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

      // Arc left and right
      ctx.beginPath();
      ctx.arc(-s * 0.05, 0, s * 0.35, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(s * 0.05, 0, s * 0.35, Math.PI * 1.5, Math.PI * 0.5);
      ctx.stroke();

      // Center text
      ctx.font = `bold ${Math.round(s * 0.11)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("BEST", 0, -s * 0.06);
      ctx.fillText("CHOICE", 0, s * 0.08);
      ctx.restore();
    }
  }
];
