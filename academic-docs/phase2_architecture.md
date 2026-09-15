# المرحلة الثانية: المعمارية البرمجية وتصميم الواجهة
## ImagePro Studio — Software Architecture & UI Design Specification

**نوع الوثيقة:** وثيقة التصميم المعماري وواجهة المستخدم  
**الإصدار:** 1.0  
**الحالة:** جاهزة للمراجعة الأكاديمية  
**النطاق:** النسخة الأساسية القابلة للتوسع

---

## 1. هدف المرحلة الثانية

تهدف هذه المرحلة إلى تحويل متطلبات المرحلة الأولى إلى تصميم قابل للتنفيذ. وتشمل تحديد مكونات النظام، مسؤولية كل مكوّن، تدفق البيانات، نموذج المشروع والطبقات، أسلوب إدارة الحالة، حدود المحرك الرسومي، تصميم واجهة المستخدم، قواعد التفاعل، ومتطلبات القابلية للاختبار والأداء.

تتبنى المرحلة مبدأ الفصل بين واجهة المستخدم ومحرك معالجة الصور وإدارة المشروع. لذلك لا ينبغي أن تحتوي مكونات الواجهة على خوارزميات الفلاتر مباشرة، ولا ينبغي أن يعرف محرك المعالجة تفاصيل أزرار الواجهة أو ألوانها.

---

## 2. المبادئ الهندسية المعتمدة

| المبدأ | تطبيقه في ImagePro Studio |
|---|---|
| Separation of Concerns | فصل الواجهة، الحالة، المحرك، التصدير، والتخزين |
| Single Responsibility | كل وحدة تنفذ مسؤولية محددة قابلة للاختبار |
| Dependency Inversion | الواجهة تتعامل مع واجهات مجردة للمحرك بدلاً من تفاصيل Canvas |
| Command Pattern | تمثيل كل تعديل كأمر يدعم التنفيذ والتراجع |
| Data-Oriented Design | تمثيل المشروع والطبقات والتعديلات كبيانات قابلة للتسلسل |
| Progressive Enhancement | تشغيل الوظائف الأساسية دون الاعتماد على WebGL أو الذكاء الاصطناعي |
| Non-destructive Editing | حفظ الأصل والتعديلات كطبقات أو عمليات متى كان ذلك ممكناً |
| Fail Safely | فشل عملية واحدة لا يؤدي إلى فقدان المشروع كله |
| Testability | تصميم المحرك كدوال نقية أو خدمات مستقلة قابلة للاختبار |

---

## 3. المعمارية العامة

يعتمد النظام في النسخة الحالية على تطبيق Frontend منظم إلى أربع طبقات منطقية:

```text
Presentation Layer
        ↓
Application / State Layer
        ↓
Image Domain Layer
        ↓
Rendering & Persistence Adapters
```

### 3.1 Presentation Layer

تتولى عرض الشريط العلوي، شريط الأدوات، مساحة العمل، لوحة الطبقات، لوحة الخصائص، الرسائل، وحالات التحميل. تستخدم React وshadcn/ui وLucide Icons، ولا تنفذ عمليات البكسل مباشرة.

### 3.2 Application / State Layer

تتولى الحالة الحالية للمشروع، الطبقة المحددة، الأداة النشطة، التاريخ، إعدادات العرض، وحالة الحفظ. يفضل استخدام Zustand أو Redux Toolkit عند بدء تنفيذ الحالة الكاملة.

### 3.3 Image Domain Layer

تتضمن تعريف الطبقات، التعديلات، الأقنعة، التحويلات، الفلاتر، الألوان، ونظام الأوامر. هذه الطبقة لا تعتمد على مكونات React.

### 3.4 Rendering & Persistence Adapters

تضم Canvas 2D، OpenCV.js، Web Workers، WebGL/PixiJS لاحقاً، File API، IndexedDB، وخدمات التخزين. تكون هذه الوحدات قابلة للاستبدال دون تغيير واجهة المستخدم.

---

## 4. هيكل المجلدات المقترح

```text
client/src/
├── components/
│   ├── editor/
│   │   ├── CommandBar.tsx
│   │   ├── ToolRail.tsx
│   │   ├── CanvasWorkspace.tsx
│   │   ├── InspectorRail.tsx
│   │   ├── LayersPanel.tsx
│   │   ├── PropertiesPanel.tsx
│   │   └── StatusBar.tsx
│   └── ui/
├── contexts/
│   └── EditorContext.tsx
├── hooks/
│   ├── useEditorState.ts
│   ├── useCanvasRenderer.ts
│   ├── useKeyboardShortcuts.ts
│   └── useAutosave.ts
├── lib/
│   ├── image-engine/
│   │   ├── color.ts
│   │   ├── filters.ts
│   │   ├── transforms.ts
│   │   ├── selection.ts
│   │   ├── masks.ts
│   │   └── renderer.ts
│   ├── history/
│   │   ├── command.ts
│   │   └── history-manager.ts
│   ├── persistence/
│   │   ├── project-serializer.ts
│   │   └── local-project-store.ts
│   └── validation.ts
├── pages/
│   └── Home.tsx
└── index.css
```

---

## 5. نموذج البيانات الأساسي

### 5.1 المشروع

```ts
export type Project = {
  id: string;
  name: string;
  width: number;
  height: number;
  resolution: number;
  colorProfile: "srgb";
  background: BackgroundDefinition;
  layers: Layer[];
  activeLayerId: string | null;
  history: HistoryState;
  metadata: ProjectMetadata;
};
```

### 5.2 الطبقة

```ts
export type Layer = {
  id: string;
  name: string;
  type: "image" | "paint" | "text" | "fill" | "adjustment" | "group";
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  transform: Transform;
  content: LayerContent;
  mask?: MaskDefinition;
  effects: EffectDefinition[];
};
```

### 5.3 التحويل

```ts
export type Transform = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  skewX: number;
  skewY: number;
};
```

### 5.4 التعديل

```ts
export type Adjustment = {
  id: string;
  type: "brightness" | "contrast" | "saturation" | "hue" | "grayscale" | "levels" | "curves";
  values: Record<string, number>;
  enabled: boolean;
};
```

تستخدم هذه النماذج كمرجع مشترك بين الفريق؛ فلا يعرّف كل عضو نموذجاً مختلفاً للطبقة أو العملية.

---

## 6. إدارة الحالة

تقسم الحالة إلى ثلاثة أنواع:

| نوع الحالة | أمثلة | مكانها المقترح |
|---|---|---|
| حالة التطبيق | المشروع الحالي، الطبقات، التاريخ | Zustand/Redux |
| حالة الواجهة | اللوحة المفتوحة، الأداة النشطة، التكبير | Zustand أو React state المحلي |
| حالة المحرك | Canvas context، Worker، render queue | Hooks وadapters |

### قواعد الحالة

1. لا تنفذ مكونات العرض تعديلاً مباشراً على بيانات الصورة.
2. كل تعديل يمر عبر Action واضح.
3. بعد كل تعديل، يعاد بناء Render Plan بدلاً من نسخ الصورة في كل مرة.
4. تحفظ الحالة القابلة للتسلسل منفصلة عن مراجع DOM وCanvas.
5. يمنع وضع File أو ImageBitmap داخل JSON المشروع؛ تحفظ المراجع أو البيانات الثنائية في طبقة تخزين منفصلة.

---

## 7. نظام التراجع والإعادة

يستخدم الفريق Command Pattern. يمثل الأمر عملية مثل تطبيق سطوع أو إضافة طبقة أو تغيير حجم.

```ts
export type EditorCommand = {
  id: string;
  label: string;
  execute: (project: Project) => Project;
  undo: (project: Project) => Project;
};
```

يحتوي History Manager على مؤشر للموقع الحالي، ومصفوفة أوامر، وحد أقصى للتاريخ. عند تنفيذ أمر جديد بعد Undo، تحذف أوامر Redo التي لم تعد صالحة.

هذا التصميم يجعل التراجع قابلاً للاختبار دون تشغيل الواجهة، ويمنع ربط كل زر بمنطق خاص.

---

## 8. استراتيجية عرض Canvas

يستخدم النظام مرحلتين:

1. **Preview Render:** نسخة منخفضة أو متوسطة الدقة لعرض التفاعل بسرعة.
2. **Export Render:** إعادة رسم بالدقة الأصلية عند التصدير.

تتكون عملية العرض من:

```text
Project State
   ↓
Render Plan
   ↓
Layer Composition
   ↓
Mask & Blend Processing
   ↓
Adjustments & Filters
   ↓
Canvas / WebGL Output
```

يجب ألا يعاد تحميل الصورة من القرص عند كل تغيير منزلق. تحفظ ImageBitmap أو Texture في ذاكرة مناسبة، وتستخدم queue للعمليات الثقيلة.

---

## 9. سياسة الأداء

| المشكلة | الحل المعماري |
|---|---|
| فلتر ثقيل يجمّد الواجهة | Web Worker |
| صورة كبيرة | Preview resolution مع Export resolution منفصلة |
| كثرة إعادة الرسم | Render scheduling وrequestAnimationFrame |
| طبقات كثيرة | Cache للطبقات غير المتغيرة |
| فلاتر متسلسلة | Render graph قابل لإعادة الاستخدام |
| WebGL غير متاح | Fallback إلى Canvas 2D |
| عملية طويلة | Progress state وإمكانية الإلغاء |

يقاس الأداء باستخدام زمن تنفيذ الفلتر، زمن إعادة الرسم، معدل الإطارات أثناء السحب، استهلاك الذاكرة، ووقت التصدير.

---

## 10. تصميم واجهة المستخدم

تعتمد الواجهة على بيئة تحرير كاملة الشاشة من خمسة أجزاء:

| الجزء | موقعه | وظيفته |
|---|---|---|
| Command Bar | أعلى الشاشة | المشروع، القوائم، الحفظ، التصدير، حالة الحساب |
| Tool Rail | جانب الشاشة | الأدوات الأساسية والاختصارات |
| Canvas Workspace | المركز | عرض الصورة والتحديد والتحويل |
| Inspector Rail | الجانب المقابل | الطبقات والخصائص والتعديلات |
| Status Bar | أسفل الشاشة | حالة المعالجة، الذاكرة، التكبير، ونسخة المحرك |

### قواعد التصميم

- مساحة الصورة هي العنصر الأكبر بصرياً.
- Signal Teal يستخدم للحالة النشطة فقط.
- جميع اللوحات ذات عناوين واضحة وبيانات مختصرة.
- لا تستخدم البطاقات التسويقية داخل مساحة التحرير.
- تكون الأدوات قابلة للوصول بالماوس ولوحة المفاتيح.
- يظهر اسم الأداة والاختصار عند المرور عليها.
- يستخدم الوضع الداكن لتقليل تشتيت الألوان حول الصورة.

---

## 11. تصميم التفاعل

### حالات الأداة

كل أداة تمر بالحالات التالية:

```text
idle → selected → interacting → previewing → committed
                                      ↘ cancelled
```

لا تعتمد الأداة التعديل نهائياً قبل Commit. وعند الإلغاء تعود الصورة إلى حالة ما قبل العملية.

### التفاعل مع الطبقات

النقر على الطبقة يحددها ويحدث لوحة الخصائص. النقر على رمز العين يغير الظهور دون تحديد الطبقة. السحب يعيد الترتيب. وتظهر حالة الطبقة المحددة بحد فيروزي هادئ.

### اختصارات لوحة المفاتيح

| الاختصار | الأداة أو العملية |
|---|---|
| V | التحديد |
| H | اليد والتحريك |
| C | القص |
| B | الفرشاة |
| E | الممحاة |
| T | النص |
| Ctrl/Cmd + Z | تراجع |
| Ctrl/Cmd + Shift + Z | إعادة |
| Ctrl/Cmd + S | حفظ |
| Space | تحريك مؤقت |

---

## 12. حالات النظام

يجب تصميم الواجهة للحالات التالية، لا للحالة الطبيعية فقط:

| الحالة | السلوك |
|---|---|
| لا يوجد مشروع | Empty state يشرح إنشاء مشروع أو رفع صورة |
| جار رفع صورة | Progress واسم الملف |
| جار تطبيق فلتر | تعطيل العملية المتعارضة وإظهار حالة المعالجة |
| فشل الملف | رسالة واضحة مع سبب قابل للفهم |
| لا توجد طبقة محددة | تعطيل أدوات الطبقة أو توضيح المطلوب |
| المشروع غير محفوظ | نقطة بجانب الاسم ورسالة قبل الإغلاق |
| فقدان WebGL | التحويل إلى Canvas 2D مع تنبيه غير مزعج |
| صورة كبيرة جداً | اقتراح استخدام Preview resolution |
| نجاح التصدير | رابط أو تأكيد بإنشاء الملف |

---

## 13. طبقة التخزين

في النسخة الأساسية يستخدم النظام IndexedDB لحفظ المشروع محلياً، لأن المشاريع قد تحتوي على بيانات أكبر من أن تكون مناسبة لـ localStorage. يكون Serializer مسؤولاً عن تحويل مشروع ImagePro إلى JSON، بينما تحفظ البيانات الثنائية في Blob stores منفصلة.

في النسخة المتقدمة يمكن إضافة API وخادم وتخزين كائنات. يجب ألا تحفظ الصور الكبيرة مباشرة داخل قاعدة البيانات العلائقية.

---

## 14. واجهات الوحدات الداخلية

```ts
export interface ImageEngine {
  applyFilter(input: ImageData, filter: FilterDefinition): Promise<ImageData>;
  applyAdjustment(input: ImageData, adjustment: Adjustment): Promise<ImageData>;
  transform(input: ImageBitmap, transform: Transform): Promise<ImageBitmap>;
  composite(project: Project): Promise<RenderOutput>;
}

export interface ProjectStore {
  save(project: Project): Promise<void>;
  load(id: string): Promise<Project | null>;
  remove(id: string): Promise<void>;
  list(): Promise<ProjectSummary[]>;
}

export interface ExportService {
  export(project: Project, options: ExportOptions): Promise<Blob>;
}
```

هذه الواجهات تفصل التنفيذ عن الاستخدام، وتسمح باستبدال Canvas 2D بـ WebGL أو التخزين المحلي بتخزين سحابي دون إعادة كتابة مكونات الواجهة.

---

## 15. تصميم الاختبار في المرحلة الثانية

يجب أن يكتب الفريق الاختبارات بالتزامن مع الوحدات:

| الوحدة | الاختبار |
|---|---|
| Color utilities | قيم RGB وHSL والتحويلات الحدية |
| Filters | نتيجة فلتر صغيرة مع صورة مرجعية |
| Transform | الأبعاد والزاوية والحفاظ على التناسب |
| History Manager | execute وundo وredo والفرع الجديد |
| Layer Manager | الترتيب والظهور والشفافية |
| Serializer | حفظ واستعادة مشروع دون فقد البيانات |
| UI | تحديد أداة، تحديد طبقة، تغيير تكبير |
| Export | صيغة الملف والأبعاد والشفافية |

---

## 16. قرارات المرحلة الثانية

1. تعتمد النسخة الأولية على React وTypeScript وVite.
2. يستخدم Canvas 2D كنواة أولى مع تصميم يسمح بإضافة WebGL.
3. يفصل محرك الصورة عن React.
4. يعتمد المشروع نموذج Layers وCommands منذ البداية.
5. تستخدم IndexedDB للحفظ المحلي عند تنفيذ وحدة التخزين.
6. تعتمد الواجهة على التخطيط ثلاثي المحاور مع شريط علوي وسفلي.
7. تكون الهوية البصرية فحمية مع Signal Teal، وخطوط Space Grotesk وIBM Plex Sans Arabic.
8. تحفظ الميزات المعتمدة على الخادم والذكاء الاصطناعي كامتدادات لاحقة.

---

## 17. مخرجات المرحلة الثانية

- مشروع React مهيأ وقابل للتشغيل.
- هوية بصرية موثقة في ideas.md.
- واجهة أولية احترافية لمساحة التحرير.
- تصور واضح لمكونات النظام ومجلداته.
- نموذج بيانات للمشروع والطبقات والتعديلات.
- سياسة واضحة لإدارة الحالة والتاريخ والرسم.
- تصميم تفاعل الأدوات والطبقات والحالات.
- خطة أداء وأمان واختبار قابلة للتنفيذ.

**حالة المرحلة:** التصميم المعماري والمرئي منفذان في النسخة الأولية وقابلان للمراجعة قبل بدء تنفيذ محرك معالجة الصور الكامل.
