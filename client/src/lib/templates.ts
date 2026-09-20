/**
 * ImagePro Studio — Social Media & Marketing Templates Catalog
 */

export interface DesignTemplatePreset {
  id: string;
  nameAr: string;
  nameEn: string;
  category: "social" | "marketing" | "print";
  width: number;
  height: number;
  icon: string;
  aspect: string;
  descriptionAr: string;
  descriptionEn: string;
}

export const DESIGN_TEMPLATES: DesignTemplatePreset[] = [
  {
    id: "insta-square",
    nameAr: "منشور إنستغرام مربع",
    nameEn: "Instagram Post",
    category: "social",
    width: 1080,
    height: 1080,
    icon: "📸",
    aspect: "1:1",
    descriptionAr: "المنشور المربع القياسي لإنستغرام وفيسبوك (1080×1080)",
    descriptionEn: "Standard square social post (1080×1080)",
  },
  {
    id: "story-vertical",
    nameAr: "قصة إنستغرام / تيك توك",
    nameEn: "Story / TikTok / Reel",
    category: "social",
    width: 1080,
    height: 1920,
    icon: "📱",
    aspect: "9:16",
    descriptionAr: "فيديو وقصة رأسية للشاشات الذكية (1080×1920)",
    descriptionEn: "Vertical 9:16 mobile story & reels format (1080×1920)",
  },
  {
    id: "ecommerce-banner",
    nameAr: "إعلان تجاري لمنتج",
    nameEn: "E-Commerce Product Banner",
    category: "marketing",
    width: 1200,
    height: 628,
    icon: "🛍️",
    aspect: "1.91:1",
    descriptionAr: "إعلانات جوجل وفيسبوك التجارية لترويج المنتجات (1200×628)",
    descriptionEn: "High-conversion product ad banner (1200×628)",
  },
  {
    id: "youtube-thumb",
    nameAr: "غلاف فيديو يوتيوب",
    nameEn: "YouTube Thumbnail",
    category: "social",
    width: 1280,
    height: 720,
    icon: "🎬",
    aspect: "16:9",
    descriptionAr: "صورة مصغرة عالية الدقة لفيديوهات يوتيوب (1280×720)",
    descriptionEn: "High-definition video thumbnail (1280×720)",
  },
  {
    id: "header-cover",
    nameAr: "غلاف لينكد إن / فيسبوك",
    nameEn: "Platform Header Cover",
    category: "social",
    width: 1920,
    height: 1080,
    icon: "💼",
    aspect: "16:9",
    descriptionAr: "بانر رأسي للملفات الشخصية وصفحات الشركات (1920×1080)",
    descriptionEn: "Wide header banner for professional pages (1920×1080)",
  },
  {
    id: "business-card",
    nameAr: "بطاقة أعمال شخصية",
    nameEn: "Business Card",
    category: "print",
    width: 1050,
    height: 600,
    icon: "💳",
    aspect: "1.75:1",
    descriptionAr: "بطاقة تعريف وهوية شخصية تجارية (1050×600)",
    descriptionEn: "Standard digital & print business card (1050×600)",
  },
];
