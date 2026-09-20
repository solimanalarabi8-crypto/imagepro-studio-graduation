/**
 * ImagePro Studio — دليل المستخدم التفاعلي
 * إعداد: سليمان العربي | يعقوب المهاجري | مالك عادل
 */

import { useState } from "react";
import {
  X, ChevronRight, ChevronDown, Brush, Pencil, Eraser, PaintBucket,
  MousePointer2, Hand, Crop, Type, Square, SlidersHorizontal,
  WandSparkles, Stamp, Sparkles, Layers3, Download, FolderOpen,
  RotateCcw, Undo2, Redo2, ZoomIn, Grid, Info
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Section {
  id: string;
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  items: GuideItem[];
}

interface GuideItem {
  title: string;
  description: string;
  steps?: string[];
  tip?: string;
  shortcut?: string;
}

// ─────────────────────────────────────────────
// Guide Data — كل القسام
// ─────────────────────────────────────────────
const GUIDE_SECTIONS: Section[] = [
  {
    id: "start",
    icon: FolderOpen,
    title: "البداية — فتح الصورة وإنشاء المشروع",
    items: [
      {
        title: "فتح صورة موجودة",
        description: "قم برفع أي صورة من جهازك (JPG، PNG، WebP) لبدء التحرير.",
        steps: [
          "اضغط ملف > فتح صورة... من شريط القوائم",
          "أو اسحب الصورة مباشرة وأفلتها في منطقة العمل",
          "أو استخدم الاختصار Ctrl+O",
        ],
        tip: "الحد الأقصى لحجم الملف 25 ميجابايت",
      },
      {
        title: "مشروع جديد من الصفر",
        description: "إنشاء لوح عمل فارغ بأبعاد محددة.",
        steps: [
          "ملف > مشروع جديد... أو Ctrl+N",
          "حدد العرض والارتفاع بالبكسل",
          "اختر لون الخلفية: شفاف، أبيض، أو أسود",
          "اضغط إنشاء",
        ],
        shortcut: "Ctrl+N",
      },
      {
        title: "استخدام الصور النموذجية",
        description: "للتجربة الفورية بدون رفع صورة.",
        steps: [
          "ملف > الصور النموذجية",
          "اختر من: صورة شخصية، منظر طبيعي، أو طبيعة صامتة",
        ],
      },
      {
        title: "حفظ واستئناف العمل",
        description: "النظام يحفظ تلقائياً في المتصفح، ويمكنك تصدير ملف مشروع.",
        steps: [
          "ملف > حفظ كملف مشروع (.imagepro) لحفظ كل شيء",
          "ملف > استيراد ملف مشروع لفتح عمل سابق",
        ],
        tip: "ملف .imagepro يحفظ الصورة + الطبقات + التعديلات + النصوص",
      },
    ],
  },
  {
    id: "tools",
    icon: Brush,
    title: "شريط الأدوات — الاستخدام التفصيلي",
    items: [
      {
        title: "تحديد (V) — أداة الاختيار",
        description: "رسم مستطيل تحديد على الصورة لتقييد أي عملية على منطقة محددة فقط.",
        steps: [
          "اضغط على أيقونة التحديد أو اضغط V",
          "اسحب على الصورة لرسم التحديد",
          "يمكن ضبط الشكل: مستطيل، بيضاوي، أو حر",
          "خيارات: استبدال / إضافة / طرح من التحديد",
          "اضغط Ctrl+A لتحديد كل الصورة",
          "اضغط Escape لإلغاء التحديد",
        ],
        shortcut: "V",
        tip: "عند وجود تحديد نشط، جميع الأدوات تعمل داخله فقط",
      },
      {
        title: "تحريك (H) — يد التنقل",
        description: "تحريك عرض الصورة عند التكبير.",
        steps: [
          "اضغط H أو اضغط مفتاح المسافة أثناء استخدام أي أداة",
          "اسحب الصورة في أي اتجاه",
        ],
        shortcut: "H أو مفتاح المسافة",
      },
      {
        title: "قص (C) — القص والاقتصاص",
        description: "قص الصورة أو تعديل أبعادها.",
        steps: [
          "اضغط C واسحب لتحديد منطقة القص",
          "يمكن تطبيق القص على تحديد موجود مسبقاً",
        ],
        shortcut: "C",
      },
      {
        title: "فرشاة (B) — الرسم الناعم",
        description: "فرشاة رسم ناعمة قابلة للتخصيص.",
        steps: [
          "اضغط B لتفعيل الفرشاة",
          "اضبط حجم الفرشاة من شريط الجانب (2–200 بكسل)",
          "اضبط الشفافية (10–100%)",
          "اضبط الصلابة (0 = ناعمة جداً، 100 = حادة)",
          "اختر لون الرسم من مربع الألوان",
        ],
        shortcut: "B",
        tip: "الرسم يتم على الطبقة المحددة الحالية",
      },
      {
        title: "قلم دقيق (N) — الرسم الحاد",
        description: "خطوط حادة بدون تمويه على الحواف.",
        steps: ["اضغط N، اسحب للرسم بخطوط بكسل حادة"],
        shortcut: "N",
      },
      {
        title: "ممحاة (E) — المحو",
        description: "محو الرسومات بحجم وشفافية قابلة للتعديل.",
        steps: [
          "اضغط E لتفعيل الممحاة",
          "اضبط الحجم والشفافية",
          "اسحب على المنطقة المراد محوها",
        ],
        shortcut: "E",
        tip: "الممحاة تمحو رسومات الطبقة الحالية فقط، وليس الصورة الأصلية",
      },
      {
        title: "دلو التلوين (G) — تعبئة باللون",
        description: "تعبئة منطقة بلون محدد بناءً على تشابه الألوان.",
        steps: [
          "اضغط G",
          "اضبط عتبة التشابه (كلما زادت، اتسعت المنطقة المملوءة)",
          "اضغط على المنطقة المراد تعبئتها",
        ],
        shortcut: "G",
      },
      {
        title: "قطّارة اللون (I) — سحب اللون",
        description: "أخذ عينة لون من أي نقطة في الصورة.",
        steps: [
          "اضغط I",
          "اضغط على أي نقطة في الصورة",
          "سيتم تعيين اللون المختار كلون الرسم الأمامي",
        ],
        shortcut: "I",
      },
      {
        title: "نص (T) — إضافة نصوص",
        description: "إضافة نصوص باللغتين العربية والإنجليزية بخطوط متعددة.",
        steps: [
          "اضغط T ثم اضغط في أي مكان على الصورة",
          "اكتب النص في حقل النص بشريط الجانب",
          "اختر الخط من القائمة (Cairo، Tajawal، Amiri، Inter، إلخ)",
          "اضبط: الحجم، اللون، الوزن، الميل، المحاذاة",
          "خيارات متقدمة: ظل، توهج، حدود، تدرج، تباعد الأحرف",
          "اسحب النص لتغيير موضعه",
        ],
        shortcut: "T",
        tip: "يمكن تدوير النص بالشريط الجانبي",
      },
      {
        title: "أشكال (U) — رسم الأشكال الهندسية",
        description: "رسم مستطيلات، دوائر، مثلثات، ونجوم.",
        steps: [
          "اضغط U واختر الشكل من شريط الجانب",
          "الأشكال المتاحة: مستطيل، دائرة، مثلث، نجمة، سداسي",
          "وضع التعبئة: حدود فقط، تعبئة فقط، أو الاثنان",
          "اسحب على الصورة لرسم الشكل",
        ],
        shortcut: "U",
      },
    ],
  },
  {
    id: "adjustments",
    icon: SlidersHorizontal,
    title: "التعديلات اللونية والضوئية",
    items: [
      {
        title: "التعديلات الأساسية",
        description: "التحكم في الإضاءة والألوان الأساسية للصورة.",
        steps: [
          "السطوع: رفع أو خفض مستوى الإضاءة الكلي",
          "التباين: زيادة الفارق بين الفاتح والداكن",
          "التشبع: قوة حيوية الألوان",
          "التدرج الرمادي: تحويل إلى أبيض وأسود جزئياً أو كلياً",
          "السيبيا: درجات بنية تعطي طابعاً قديماً",
          "الانعكاس: عكس ألوان الصورة بالكامل",
        ],
      },
      {
        title: "التعديلات المتقدمة",
        description: "تعديلات احترافية للتحكم الدقيق في الصورة.",
        steps: [
          "درجة اللون (Hue): تدوير ألوان الطيف (−180 إلى +180)",
          "التعرض للضوء (Exposure): محاكاة قيمة f-stop للكاميرا",
          "درجة الحرارة اللونية: أدفأ (أصفر) ← بارد (أزرق)",
          "جاما (Gamma): تصحيح التدرج في الظلال والإضاءات",
          "توازن الألوان (R/G/B): ضبط قناة كل لون مستقل",
          "العتبة (Threshold): تحويل ثنائي أسود/أبيض عند قيمة محددة",
        ],
        tip: "اضغط زر ↺ بجانب أي شريط لإعادته إلى القيمة الافتراضية",
      },
      {
        title: "الهستوجرام",
        description: "رسم بياني يعرض توزيع درجات الإضاءة في الصورة.",
        steps: [
          "يظهر الهستوجرام أسفل التعديلات",
          "القنوات الثلاث: أحمر، أخضر، أزرق",
          "0 = ظلال داكنة جداً / 255 = إضاءات فاتحة جداً",
          "التحديث تلقائي مع كل تعديل",
        ],
      },
      {
        title: "مقارنة قبل/بعد",
        description: "رؤية الصورة الأصلية للمقارنة أثناء التعديل.",
        steps: [
          "اضغط زر عرض الأصل في أعلى لوحة التعديلات",
          "تظهر الصورة الأصلية بدون أي تعديلات",
          "اضغط مرة أخرى للعودة للعرض المعدّل",
        ],
      },
    ],
  },
  {
    id: "filters",
    icon: Grid,
    title: "مكتبة الفلاتر (21 فلتر)",
    items: [
      {
        title: "فلاتر التمويه — 3 أنواع",
        description: "إضافة ضبابية وتنعيم للصورة.",
        steps: [
          "تمويه جاوسي (Gaussian): تنعيم ناعم وطبيعي — الأكثر شيوعاً",
          "تمويه صندوقي (Box): توسيط لوني موحد",
          "تمويه حركي (Motion): محاكاة حركة السرعة الأفقية",
        ],
      },
      {
        title: "فلاتر الحدة — نوعان",
        description: "إبراز التفاصيل الدقيقة.",
        steps: [
          "زيادة الحدة (Sharpen): إبراز التفاصيل والمحيط",
          "قناع الحدة الفائق (Unsharp): تعزيز التباين المجهري للحواف",
        ],
      },
      {
        title: "فلاتر الحواف — 4 أنواع",
        description: "استخراج حواف الأجسام بخوارزميات رياضية.",
        steps: [
          "Sobel: كشف الحواف بالتدرج الرياضي",
          "Canny: خطوط حواف متصلة ودقيقة جداً",
          "Laplacian: استخراج تفاصيل التردد العالي",
          "Emboss: تأثير نقش بارز ثلاثي الأبعاد",
        ],
      },
      {
        title: "فلاتر الضوضاء — 3 أنواع",
        description: "إضافة أو إزالة الضوضاء (Noise).",
        steps: [
          "إضافة ضوضاء (Noise): حبيبات فيلمية سينمائية",
          "الفلتر الوسيط (Median): إزالة الشوائب مع حماية الحواف",
          "التنعيم الثنائي (Bilateral): تنعيم ذكي يحفظ تفاصيل الوجه",
        ],
      },
      {
        title: "فلاتر هندسية — نوعان",
        description: "تغيير البنية البصرية للصورة.",
        steps: [
          "فسيفساء وبكسلة (Pixelate): تجزئة الصورة إلى مربعات بكسل كبيرة",
          "ملصق نغمي (Posterize): تقليص التدرجات إلى مساحات لونية صلبة",
        ],
      },
      {
        title: "فلاتر لونية — 4 أنواع",
        description: "تطبيق تأثيرات لونية جمالية.",
        steps: [
          "عتيق ريترو (Vintage): ألوان دافئة بنغمات كلاسيكية",
          "سيبيا فوتوغرافي (Sepia): درجات بنية تاريخية",
          "تعتيم الأطراف (Vignette): تركيز الضوء على المركز",
          "ثنائي اللون (Duotone): تلوين بلونين إنديجو وتركواز",
        ],
      },
      {
        title: "فلاتر فنية — 3 أنواع",
        description: "تحويل الصورة إلى أعمال فنية.",
        steps: [
          "رسم رصاص (Sketch): تحويل الصورة إلى خطوط قلم رصاص",
          "لوحة زيتية (Oil Painting): محاكاة ضربات الفرشاة الفنية الكثيفة",
          "رسم فحم (Charcoal): تظليل فحمي عالي الدراما والتباين",
        ],
        tip: "يمكن ضبط شدة أي فلتر بالشريط الجانبي (0–100%)",
      },
    ],
  },
  {
    id: "retouch",
    icon: Sparkles,
    title: "أدوات التنقيح والتصحيح (Retouch)",
    items: [
      {
        title: "ختم الاستنساخ (Clone Stamp) — S",
        description: "نسخ منطقة من الصورة إلى مكان آخر.",
        steps: [
          "اضغط S أو اختر أداة التنقيح ثم Clone",
          "اضغط Alt + النقر لتحديد نقطة المصدر",
          "اسحب على المنطقة الهدف لنسخ النسيج",
          "اضبط الحجم والشفافية والصلابة",
        ],
        shortcut: "S",
        tip: "مفيد لإخفاء عيوب أو عناصر غير مرغوب فيها",
      },
      {
        title: "فرشاة المعالجة (Healing Brush) — J",
        description: "إصلاح المنطقة مع مزج النسيج والألوان المحيطة.",
        steps: [
          "اختر أداة التنقيح ثم Heal",
          "حدد نقطة المصدر بـ Alt+Click",
          "اسحب على المنطقة المعيبة",
        ],
        shortcut: "J",
        tip: "أفضل من Clone Stamp لأنها تدمج الألوان تلقائياً",
      },
      {
        title: "المعالجة الفورية (Spot Healing)",
        description: "إزالة عيوب صغيرة بضغطة واحدة بدون تحديد مصدر.",
        steps: [
          "اختر وضع Spot من قائمة التنقيح",
          "اضغط مباشرة على البثرة أو العيب الصغير",
          "النظام يحدد المصدر تلقائياً من الحواف المحيطة",
        ],
        tip: "الأسرع لإزالة الشوائب الصغيرة المعزولة",
      },
      {
        title: "إزالة العيون الحمراء (Red-Eye)",
        description: "إزالة ظاهرة العيون الحمراء في صور الفلاش.",
        steps: [
          "اختر وضع Red-Eye",
          "اضغط على بؤبؤ العين في الصورة",
          "يعمل بدقة على صور الوجه المُضاءة بالفلاش",
        ],
      },
      {
        title: "تنعيم البشرة (Skin Smooth)",
        description: "تنعيم جلد الوجه مع الحفاظ على التفاصيل الطبيعية.",
        steps: [
          "اختر وضع Skin Smooth",
          "اضبط شدة التنعيم (0–100%)",
          "اسحب على مناطق الجلد المراد تنعيمها",
          "الفلتر الثنائي يعمل على ألوان الجلد فقط",
        ],
      },
      {
        title: "التعبئة الذكية (Inpaint Fill)",
        description: "ملء منطقة محددة بنسيج يتناسب مع المحيط.",
        steps: [
          "ارسم تحديداً على المنطقة المراد إزالتها",
          "اختر وضع Inpaint",
          "اضغط تطبيق — سيملأ المنطقة بنسيج المحيط",
        ],
        tip: "مفيد لإزالة كائنات كاملة من الصورة",
      },
    ],
  },
  {
    id: "ai",
    icon: WandSparkles,
    title: "إزالة الخلفية بالذكاء الاصطناعي",
    items: [
      {
        title: "عزل المحتوى الصافي والتحريك الحر (بدون أي خلفية)",
        description: "عزل محتوى الصورة الرئيسي بالذكاء الاصطناعي وجعله عنصراً حراً قابلاً للتحريك بالسحب في أي مكان على الكانفاس بدون أي مساحة عمل أو طبقة مقيدة خلفه.",
        steps: [
          "افتح لوحة الخصائص > قسم تأثيرات الخلفية",
          "اضغط: 🎯 عزل المحتوى الصافي فقط (بدون أي خلفية)",
          "يتم عزل الشخص وتفعيل أداة تحريك وتحديد العنصر (V) تلقائياً",
          "اسحب الشخص مباشرة بالماوس في أي مكان على مساحة العمل",
          "أو استخدم أزرار المحاذاة السريعة: توسيط، يمين، يسار، أعلى، أسفل",
          "اضغط 'تصدير المحتوى الصافي فقط' لتحميل PNG شفاف مفرغ وحده تماماً",
        ],
        tip: "يتحرك الشخص وحده بحرية تامة دون أن تتحرك مساحة العمل أو الكانفاس معه",
      },
      {
        title: "إزالة الخلفية بالكامل (AI Background Removal)",
        description: "عزل الجسم وجعل الخلفية شفافة تماماً باستخدام نموذج IS-Net العصبي المنقى من الشوائب.",
        steps: [
          "افتح لوحة الأدوات الذكية (الأداة السحرية)",
          "اضغط: ✂️ إزالة الخلفية بالذكاء الاصطناعي",
          "انتظر معالجة النموذج العصبي وصقل الحواف المتصلة",
          "النتيجة: صورة PNG شفافة جاهزة للتحريك والتصدير",
        ],
        tip: "يعمل بسرعة فائقة محلياً عبر الخادم مع ترشيح الألفا لمنع أي شوائب عائمة",
      },
      {
        title: "تمويه الخلفية السينمائي (Portrait Bokeh)",
        description: "تمويه الخلفية بنعومة سينمائية طبيعية ومحاكاة عدسات f/1.4 مع إبقاء الجسم حاداً 100% وبدون أي تعتيم دائري أو تشوه في الألوان.",
        steps: [
          "اضغط: 🌫️ تمويه البورتريه الاحترافي",
          "اضبط شعاع التمويه من شريط التحكم",
          "النتيجة: خلفية نقية ومموهة بإضاءتها الطبيعية + جسم حاد احترافياً",
        ],
        tip: "تمت معالجة الخوارزمية لإلغاء أي تعتيم أو تشوه لوني ولحماية أطراف الكانفاس من البهتان",
      },
      {
        title: "تحرير الجسم إلى طبقة مستقلة",
        description: "عزل الجسم ونقله كطبقة جديدة في لوحة الطبقات.",
        steps: [
          "اضغط: ✨ تحرير الجسم إلى طبقة جديدة",
          "ستظهر طبقة جديدة في لوحة الطبقات",
          "يمكن تحريكها وتعديلها مستقلاً",
        ],
      },
      {
        title: "استبدال الخلفية بألوان وتدرجات استوديو",
        description: "استبدال الخلفية بألوان وتدرجات استوديو احترافية.",
        steps: [
          "من قسم استبدال الخلفية اختر:",
          "◻️ شفاف — ⬛ أسود استوديو — ⬜ أبيض نقي",
          "🎬 تدرج سينمائي — 🟩 كروما خضراء",
        ],
        tip: "صيغة التصدير الموصى بها مع الخلفية الشفافة: PNG",
      },
      {
        title: "رفع صورة خلفية مخصصة من جهازك",
        description: "تركيب أي صورة شخصية أو منظر طبيعي من جهازك كخلفية جديدة خلف العنصر المفرّغ.",
        steps: [
          "اضغط: 🖼️ رفع صورة خلفية مخصصة من جهازك...",
          "اختر ملف الصورة من جهازك (JPG، PNG، WebP)",
          "يقوم النظام بعزل العنصر وتركيب الصورة المختارة خلفه بتدرج وأبعاد مثالية تلقائياً",
        ],
        tip: "يتم ملاءمة صورة الخلفية تلقائياً دون تشويه نسبة أبعادها (Aspect Ratio)",
      },
    ],
  },
  {
    id: "layers",
    icon: Layers3,
    title: "نظام الطبقات (Layers)",
    items: [
      {
        title: "إضافة طبقة جديدة",
        description: "إضافة طبقة رسم فارغة فوق الحالية.",
        steps: [
          "اضغط أيقونة + في لوحة الطبقات",
          "الطبقة الجديدة تظهر أعلى القائمة وتصبح النشطة",
        ],
      },
      {
        title: "إخفاء وإظهار الطبقات",
        description: "التحكم في ظهور كل طبقة.",
        steps: [
          "اضغط أيقونة العين 👁 بجانب الطبقة لإخفائها",
          "اضغط مرة أخرى لإظهارها",
        ],
      },
      {
        title: "الشفافية ووضع المزج",
        description: "التحكم في شفافية كل طبقة وطريقة مزجها مع ما تحتها.",
        steps: [
          "اختر الطبقة من اللوحة",
          "اضبط شريط الشفافية (0–100%)",
          "اختر وضع المزج: عادي، ضرب، شاشة، تراكب، إلخ",
        ],
      },
      {
        title: "قفل الطبقة",
        description: "حماية طبقة من التعديل العرضي.",
        steps: [
          "اضغط أيقونة 🔒 بجانب اسم الطبقة",
          "الطبقة المقفلة لا تقبل الرسم أو التعديل",
        ],
      },
      {
        title: "إعادة الترتيب",
        description: "تغيير ترتيب الطبقات بالسهام.",
        steps: [
          "اختر الطبقة",
          "اضغط ▲ لرفعها أو ▼ لخفضها في القائمة",
        ],
      },
      {
        title: "حذف طبقة",
        description: "حذف الطبقة المحددة نهائياً.",
        steps: [
          "اختر الطبقة",
          "اضغط أيقونة 🗑 أو زر الحذف",
          "الطبقة الأصلية (الصورة) لا يمكن حذفها",
        ],
      },
    ],
  },
  {
    id: "transform",
    icon: RotateCcw,
    title: "تحويل الصورة (Transform)",
    items: [
      {
        title: "التدوير",
        description: "تدوير الصورة بزوايا محددة أو مخصصة.",
        steps: [
          "استخدم أزرار التدوير: ↺ 90° يسار | 90° يمين ↻",
          "أو أدخل زاوية مخصصة في حقل الإدخال",
        ],
      },
      {
        title: "القلب (Flip)",
        description: "قلب الصورة أفقياً أو رأسياً.",
        steps: [
          "قلب أفقي: مرآة يمين/يسار",
          "قلب رأسي: مرآة أعلى/أسفل",
        ],
      },
      {
        title: "تغيير الحجم",
        description: "تعديل أبعاد الصورة بالبكسل.",
        steps: [
          "صورة > تغيير الحجم... من شريط القوائم",
          "أدخل العرض والارتفاع الجديدين",
          "يمكن تثبيت النسبة تلقائياً",
        ],
      },
    ],
  },
  {
    id: "history",
    icon: Undo2,
    title: "السجل والتراجع",
    items: [
      {
        title: "التراجع والإعادة",
        description: "العودة لخطوة سابقة أو الإعادة بعد التراجع.",
        steps: [
          "Ctrl+Z للتراجع عن آخر خطوة",
          "Ctrl+Y للإعادة (Redo)",
          "أو استخدم أزرار ↩ / ↪ في شريط الأدوات",
        ],
        shortcut: "Ctrl+Z / Ctrl+Y",
      },
      {
        title: "نقاط الحفظ المسماة",
        description: "حفظ حالة المشروع كنقطة رجوع مسماة.",
        steps: [
          "تحرير > حفظ نقطة مسماة...",
          "أدخل اسماً وصفياً للحالة",
          "يمكن الرجوع إليها لاحقاً من السجل",
        ],
      },
    ],
  },
  {
    id: "export",
    icon: Download,
    title: "التصدير والحفظ",
    items: [
      {
        title: "تصدير الصورة النهائية",
        description: "تحميل الصورة المحررة بصيغ مختلفة.",
        steps: [
          "ملف > تصدير مخصص... أو اضغط الاختصار Ctrl+S",
          "اختر صيغة التصدير: PNG، JPG، أو WebP",
          "اختر مقياس الدقة: 0.5× | 1× | 2× (عالي الدقة)",
          "اضبط جودة JPEG (1–100)",
          "اضغط تحميل الصورة",
        ],
        tip: "PNG يحفظ الشفافية — JPG حجم أصغر — WebP الأحدث والأكثر كفاءة",
        shortcut: "Ctrl+S",
      },
      {
        title: "صيغ التصدير الموصى بها",
        description: "اختر الصيغة المناسبة للغرض.",
        steps: [
          "للمطبوعات والدقة العالية: PNG بمقياس 2×",
          "للويب والشبكات الاجتماعية: JPG بجودة 85-92%",
          "للمواقع الحديثة: WebP بجودة 90%",
          "لإزالة الخلفية: PNG شفاف دائماً",
        ],
      },
      {
        title: "حفظ ملف المشروع (.imagepro)",
        description: "حفظ المشروع كاملاً لاستئنافه لاحقاً.",
        steps: [
          "ملف > حفظ كملف مشروع (.imagepro)",
          "يحفظ: الصورة + الطبقات + الرسومات + النصوص + التعديلات",
          "لاستئناف العمل: ملف > استيراد ملف مشروع",
        ],
      },
    ],
  },
  {
    id: "shortcuts",
    icon: Info,
    title: "اختصارات لوحة المفاتيح",
    items: [
      {
        title: "اختصارات الأدوات",
        description: "مفاتيح التنقل السريع بين الأدوات.",
        steps: [
          "V — تحديد | H — تحريك | C — قص",
          "B — فرشاة | N — قلم | E — ممحاة",
          "G — دلو | I — قطّارة | T — نص",
          "U — أشكال | S — ختم الاستنساخ",
          "J — فرشاة المعالجة",
          "Space (مع سحب) — تحريك العرض مؤقتاً",
        ],
      },
      {
        title: "اختصارات العامة",
        description: "أوامر التحرير والملف.",
        steps: [
          "Ctrl+Z — تراجع | Ctrl+Y — إعادة",
          "Ctrl+O — فتح صورة | Ctrl+N — مشروع جديد",
          "Ctrl+S — تصدير | Ctrl+A — تحديد الكل",
          "Escape — إلغاء التحديد",
          "+/- أو عجلة الفأرة — تكبير/تصغير",
          "0 — إعادة التكبير إلى 100%",
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function GuideItemCard({ item }: { item: GuideItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: open ? "rgba(45,212,191,0.05)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${open ? "rgba(45,212,191,0.25)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: "8px",
        marginBottom: "6px",
        overflow: "hidden",
        transition: "all 0.2s",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: open ? "#2dd4bf" : "#c8d8d4",
          fontFamily: "inherit",
          fontSize: "13px",
          fontWeight: open ? 700 : 500,
          textAlign: "right",
          direction: "rtl",
          gap: "8px",
        }}
      >
        <span>{item.title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {item.shortcut && (
            <span style={{
              fontSize: "10px",
              background: "rgba(45,212,191,0.15)",
              border: "1px solid rgba(45,212,191,0.3)",
              color: "#5eead4",
              padding: "2px 6px",
              borderRadius: "4px",
              fontFamily: "monospace",
            }}>
              {item.shortcut}
            </span>
          )}
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 12px 12px", direction: "rtl", color: "#a8c4be", fontSize: "12px", lineHeight: "1.7" }}>
          <p style={{ margin: "0 0 8px", color: "#c0d8d2" }}>{item.description}</p>
          {item.steps && (
            <ol style={{ margin: "0 0 8px", paddingRight: "18px", paddingLeft: 0 }}>
              {item.steps.map((step, i) => (
                <li key={i} style={{ marginBottom: "4px" }}>{step}</li>
              ))}
            </ol>
          )}
          {item.tip && (
            <div style={{
              background: "rgba(45,212,191,0.08)",
              border: "1px solid rgba(45,212,191,0.2)",
              borderRadius: "6px",
              padding: "6px 10px",
              color: "#5eead4",
              fontSize: "11px",
              display: "flex",
              gap: "6px",
              alignItems: "flex-start",
            }}>
              <span style={{ flexShrink: 0 }}>💡</span>
              <span>{item.tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionPanel({ section, isActive, onSelect }: {
  section: Section;
  isActive: boolean;
  onSelect: () => void;
}) {
  const Icon = section.icon;
  return (
    <button
      onClick={onSelect}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "9px 12px",
        background: isActive ? "rgba(45,212,191,0.12)" : "transparent",
        border: isActive ? "1px solid rgba(45,212,191,0.3)" : "1px solid transparent",
        borderRadius: "7px",
        color: isActive ? "#2dd4bf" : "#8eada8",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "12px",
        fontWeight: isActive ? 700 : 400,
        textAlign: "right",
        direction: "rtl",
        transition: "all 0.15s",
        marginBottom: "2px",
      }}
    >
      <Icon size={14} />
      <span style={{ flex: 1, textAlign: "right" }}>{section.title}</span>
    </button>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
interface UserGuideProps {
  onClose: () => void;
}

export default function UserGuide({ onClose }: UserGuideProps) {
  const [activeSection, setActiveSection] = useState(GUIDE_SECTIONS[0].id);
  const [searchQuery, setSearchQuery] = useState("");

  const currentSection = GUIDE_SECTIONS.find((s) => s.id === activeSection)!;

  // Filter items by search
  const filteredItems = searchQuery.trim()
    ? currentSection.items.filter(
        (item) =>
          item.title.includes(searchQuery) ||
          item.description.includes(searchQuery) ||
          item.steps?.some((s) => s.includes(searchQuery)) ||
          item.tip?.includes(searchQuery)
      )
    : currentSection.items;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(900px, 100%)",
          height: "min(680px, 90vh)",
          background: "linear-gradient(160deg, #0e1a19 0%, #121f1e 100%)",
          border: "1px solid rgba(45,212,191,0.2)",
          borderRadius: "14px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(45,212,191,0.05)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(45,212,191,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          direction: "rtl",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#2dd4bf", letterSpacing: "0.3px" }}>
              📖 دليل مستخدم ImagePro Studio
            </div>
            <div style={{ fontSize: "11px", color: "#6a8c85", marginTop: "2px" }}>
              إعداد: سليمان العربي • يعقوب المهاجري • مالك عادل
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#8eada8",
              borderRadius: "6px",
              padding: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* ── Sidebar ── */}
          <div style={{
            width: "230px",
            flexShrink: 0,
            borderLeft: "1px solid rgba(45,212,191,0.08)",
            padding: "12px 8px",
            overflowY: "auto",
            direction: "rtl",
          }}>
            {GUIDE_SECTIONS.map((section) => (
              <SectionPanel
                key={section.id}
                section={section}
                isActive={activeSection === section.id}
                onSelect={() => setActiveSection(section.id)}
              />
            ))}
          </div>

          {/* ── Content ── */}
          <div style={{
            flex: 1,
            padding: "16px",
            overflowY: "auto",
            direction: "rtl",
          }}>
            {/* Search */}
            <input
              type="text"
              placeholder="🔍 ابحث في هذا القسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(45,212,191,0.15)",
                borderRadius: "7px",
                padding: "8px 12px",
                color: "#c8d8d4",
                fontSize: "12px",
                fontFamily: "inherit",
                marginBottom: "14px",
                direction: "rtl",
                boxSizing: "border-box",
              }}
            />

            {/* Section Title */}
            <div style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#2dd4bf",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span>{currentSection.title}</span>
              <span style={{
                fontSize: "10px",
                background: "rgba(45,212,191,0.1)",
                border: "1px solid rgba(45,212,191,0.2)",
                color: "#5eead4",
                padding: "2px 7px",
                borderRadius: "10px",
              }}>
                {filteredItems.length} بند
              </span>
            </div>

            {/* Items */}
            {filteredItems.length > 0 ? (
              filteredItems.map((item, i) => (
                <GuideItemCard key={i} item={item} />
              ))
            ) : (
              <div style={{ color: "#6a8c85", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
                لا توجد نتائج للبحث عن "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "10px 20px",
          borderTop: "1px solid rgba(45,212,191,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          direction: "rtl",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: "10px", color: "#4a6a64" }}>
            ImagePro Studio — مشروع تخرج | معالجة الصور الرقمية
          </span>
          <button
            onClick={onClose}
            style={{
              background: "rgba(45,212,191,0.1)",
              border: "1px solid rgba(45,212,191,0.25)",
              color: "#2dd4bf",
              borderRadius: "6px",
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: "12px",
              fontFamily: "inherit",
              fontWeight: 600,
            }}
          >
            إغلاق الدليل
          </button>
        </div>
      </div>
    </div>
  );
}
