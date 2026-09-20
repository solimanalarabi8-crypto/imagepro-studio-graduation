import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DroppedImageMeta, DropActionType } from "@/lib/smart-drop-hub";
import { Layers, Wand2, Image as ImageIcon, Blend, ArrowRight, Sparkles, X } from "lucide-react";

interface SmartDropHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageMeta: DroppedImageMeta | null;
  onSelectAction: (action: DropActionType) => void;
  lang?: "ar" | "en";
}

export const SmartDropHubModal: React.FC<SmartDropHubModalProps> = ({
  isOpen,
  onClose,
  imageMeta,
  onSelectAction,
  lang = "ar",
}) => {
  if (!imageMeta) return null;
  const isAr = lang === "ar";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl overflow-hidden flex flex-col bg-slate-900/98 backdrop-blur-2xl border border-slate-700/80 text-white shadow-2xl p-0 rounded-3xl"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Canva-Grade Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-purple-900/40 via-slate-900 to-cyan-900/40 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/25 text-white">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                {isAr ? "مركز السحب والإفلات الذكي" : "Smart Drag & Drop Hub"}
                <span className="text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                  {isAr ? "إدراج فوري" : "Instant Drop"}
                </span>
              </DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? "اختر كيف ترغب في التعامل مع الصورة التي قمت بسحبها"
                  : "Choose how you want to insert your dropped image"}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 flex flex-col gap-6">
          {/* Dropped Image Preview & Metadata Banner */}
          <div className="flex items-center gap-4 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-700/80">
              <img
                src={imageMeta.dataUrl}
                alt={imageMeta.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-100 truncate">{imageMeta.name}</h4>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                <span className="bg-slate-700/60 px-2 py-0.5 rounded-md text-slate-300">
                  {imageMeta.width} × {imageMeta.height} px
                </span>
                <span className="bg-slate-700/60 px-2 py-0.5 rounded-md text-slate-300">
                  {imageMeta.formattedSize}
                </span>
                <span className="bg-slate-700/60 px-2 py-0.5 rounded-md text-slate-300 uppercase">
                  {imageMeta.type.replace("image/", "")}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Canva-Style Vibrant Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Action 1: Add as New Layer */}
            <div
              onClick={() => {
                onSelectAction("layer");
                onClose();
              }}
              className="group relative p-4 rounded-2xl cursor-pointer bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/40 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                    {isAr ? "شائع" : "Popular"}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors">
                  {isAr ? "إضافة كطبقة مستقلة" : "Add as New Layer"}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {isAr
                    ? "إدراج الصورة فوق الكانفاس الحالي مع مقابض تحويل حر للتحجيم والتدوير الفوري دون لمس عملك الأصلي."
                    : "Insert as a floating layer with 8 transform handles for scale, move, and rotate."}
                </p>
              </div>
              <div className="mt-4 pt-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all">
                  <span>{isAr ? "إدراج كطبقة" : "Insert as Layer"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Action 2: AI Magic Cutout */}
            <div
              onClick={() => {
                onSelectAction("ai_cutout");
                onClose();
              }}
              className="group relative p-4 rounded-2xl cursor-pointer bg-gradient-to-br from-purple-950/60 to-pink-950/40 border border-purple-500/30 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/40 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                    {isAr ? "ذكاء اصطناعي" : "AI Powered"}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-purple-200 transition-colors">
                  {isAr ? "تفريغ ذكي وعزل فوري" : "AI Smart Cutout"}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {isAr
                    ? "إزالة خلفية الصورة آلياً بالشبكة العصبية وإدراج العنصر المعزول شفافاً ونقياً بنسبة 100%."
                    : "Automatically remove image background with IS-Net neural network and insert isolated subject."}
                </p>
              </div>
              <div className="mt-4 pt-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 group-hover:text-purple-300 group-hover:translate-x-1 transition-all">
                  <span>{isAr ? "عزل وتفريغ" : "Extract Subject"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Action 3: Open as New Canvas */}
            <div
              onClick={() => {
                onSelectAction("new_project");
                onClose();
              }}
              className="group relative p-4 rounded-2xl cursor-pointer bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700 hover:border-slate-500 hover:shadow-xl hover:shadow-slate-500/10 transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-700/60 text-slate-300 flex items-center justify-center border border-slate-600 group-hover:bg-slate-600 group-hover:text-white transition-colors">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-slate-200 transition-colors">
                  {isAr ? "فتح كصورة أساسية جديدة" : "Open as New Canvas"}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {isAr
                    ? "بدء مشروع جديد بهذه الصورة مع مطابقة أبعاد الكانفاس الأصلية وحفظ العمل الحالي في السجل."
                    : "Replace primary canvas image and match exact dimensions while saving an undo snapshot."}
                </p>
              </div>
              <div className="mt-4 pt-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all">
                  <span>{isAr ? "بدء مشروع بهذه الصورة" : "Open as Canvas"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Action 4: Two-Image Blend Studio */}
            <div
              onClick={() => {
                onSelectAction("blend_studio");
                onClose();
              }}
              className="group relative p-4 rounded-2xl cursor-pointer bg-gradient-to-br from-cyan-950/60 to-blue-950/40 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                    <Blend className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full">
                    {isAr ? "16 نمط مزج" : "16 Blend Modes"}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">
                  {isAr ? "استوديو دمج الصورتين" : "Two-Image Blend Studio"}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {isAr
                    ? "استخدام الصورة كصورة ثانية (Image B) لمزجها ومقارنتها مع تصميمك الحالي بشريط تقسيم تفاعلي."
                    : "Set as secondary image and open the dual-image studio with split comparison and fade."}
                </p>
              </div>
              <div className="mt-4 pt-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all">
                  <span>{isAr ? "فتح استوديو الدمج" : "Open Blend Studio"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {isAr ? "يمكنك أيضاً الضغط على Esc للإلغاء في أي وقت" : "Press Esc to cancel anytime"}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="rounded-full text-slate-400 hover:text-white text-xs"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
