# مواصفات المرحلة الخامسة: الطبقات والأقنعة والتاريخ
## ImagePro Studio — Phase 5: Advanced Layers, Masks & History Specification

استناداً إلى وثيقة مشروع التخرج `academic-docs/imagepro_graduation_plan.md` (السطور 423-426 والبنود 9، 10، 12):

### 1. الأهداف
1. **نظام الطبقات المتقدم:** دعم شفافية مستقلة لكل طبقة (`opacity` من 0 إلى 100%) وأوضاع دمج حقيقية (`blendMode`).
2. **عزل الطبقات والأقنعة:** حماية محتوى كل طبقة وتطبيق الأقنعة دون التأثير على الطبقات الأخرى.
3. **لوحة سجل التعديلات التفاعلية (History Panel):** تمكين المستخدم من استعراض مسار العمل الزمني والقفز إلى أي نقطة سابقة بنقرة واحدة.
4. **مقارنة Before/After:** معاينة الصورة الأصلية بضغطة زر دون فقدان التعديلات.

### 2. معايير القبول (Acceptance Criteria)
| المعرف | الوظيفة | معيار القبول |
|---|---|---|
| P5-01 | شفافية الطبقة | تعديل شريط الشفافية ينعكس فورياً على Canvas للطبقة المحددة فقط |
| P5-02 | أوضاع الدمج | تطبيق أوضاع الدمج (`source-over`, `multiply`, `screen`, `overlay`, `soft-light`) على دمج الطبقات |
| P5-03 | لوحة السجل التفاعلية | تظهر لوحة التاريخ قائمة بالعمليات الأخيرة مع تمييز الحالة النشطة وإمكانية القفز بنقرة واحدة |
| P5-04 | التراجع والتقدم الكامل | تعمل أزرار Undo وRedo بالتزامن مع لوحة السجل دون تلف البيانات |
| P5-05 | مقارنة قبل/بعد | الضغط المطول على زر المقارنة يعرض الصورة الأصلية الصافية، والإفلات يعيد المشروع كاملاً |

### 3. نموذج البيانات (Data Model)
```typescript
interface LayerInfo {
  id: string;
  name: string;
  kind: "image" | "paint" | "text" | "mask" | "adjustment" | "background";
  color: string;
  visible: boolean;
  opacity: number; // 0 to 100
  blendMode: "normal" | "multiply" | "screen" | "overlay" | "soft-light" | "darken" | "lighten";
}

interface HistoryStep {
  id: string;
  label: string;
  timestamp: number;
  snapshot: EditorSnapshot;
}
```

### 4. استراتيجية الاختبار
- اختبارات وحدات سريعة جداً عبر Vitest لاختبار تحويل الشفافية، أوضاع الدمج، وسلامة القفز في التاريخ.
- فحص كامل للأنواع عبر TypeScript compiler.
- معاينة بصرية سريعة في المتصفح.
