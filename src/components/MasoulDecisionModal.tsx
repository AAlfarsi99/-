import React from 'react';
import { Crown, Sparkles, Check, Flame } from 'lucide-react';

interface MasoulDecisionModalProps {
  isOpen: boolean;
  buyerName: string;
  isBuyerUser: boolean;
  currentTricks: number;
  originalContract: number;
  isWatch?: boolean;
  onDeclareMasoul: () => void;
  onConcludeNormalWin: () => void;
}

export const MasoulDecisionModal: React.FC<MasoulDecisionModalProps> = ({
  isOpen,
  buyerName,
  isBuyerUser,
  currentTricks,
  originalContract,
  isWatch = false,
  onDeclareMasoul,
  onConcludeNormalWin,
}) => {
  if (!isOpen) return null;

  if (isWatch) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
        <div className="w-full max-w-[270px] bg-gradient-to-b from-[#193a2e] to-[#091a13] border-2 border-amber-400 rounded-2xl p-2.5 text-center text-slate-100 shadow-2xl flex flex-col gap-2">
          <div className="flex items-center justify-center gap-1 text-amber-300 font-black text-xs">
            <Crown className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>اللمّات نظيفة ({currentTricks})</span>
          </div>

          <p className="text-[9px] text-emerald-200 leading-tight">
            باوند (+١٨) أو خسارة للخصم (+١٥)
          </p>

          <div className="flex flex-col gap-1.5 w-full mt-0.5">
            <button
              type="button"
              onClick={onDeclareMasoul}
              className="w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-slate-950 font-black text-[10px] shadow-lg flex items-center justify-center gap-1 cursor-pointer active:scale-95 animate-pulse"
            >
              <Crown className="w-3 h-3 fill-slate-950" />
              <span>مسؤول (باوند +١٨)</span>
            </button>

            <button
              type="button"
              onClick={onConcludeNormalWin}
              className="w-full py-1 px-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-200 font-bold text-[9px] flex items-center justify-center gap-1 cursor-pointer active:scale-95"
            >
              <Check className="w-2.5 h-2.5" />
              <span>إنهاء (+{originalContract})</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#143d30] via-[#0d2720] to-[#081813] border-2 border-amber-400 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.35)] text-center text-slate-100 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-amber-400/25 rounded-full blur-2xl pointer-events-none" />

        {/* Crown Emblem */}
        <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-2.5 shadow-xl border border-amber-300/80 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 relative animate-bounce">
          <Crown className="w-7 h-7 text-slate-950 fill-amber-100 drop-shadow" />
        </div>

        {/* Title */}
        <h2 className="text-lg sm:text-xl font-black text-amber-300 mb-1 flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>اللمّات نظيفة ({currentTricks}/{currentTricks})</span>
        </h2>

        <p className="text-xs text-emerald-100/80 mb-4">
          المشتري: <strong className="text-amber-300">{isBuyerUser ? 'أنت' : buyerName}</strong>
        </p>

        {/* Rules Comparison Card */}
        <div className="grid grid-cols-2 gap-2.5 mb-5 text-right">
          <div className="bg-black/50 border border-amber-400/60 rounded-2xl p-3 flex flex-col justify-between">
            <div>
              <span className="text-[11px] text-amber-300 font-black block mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>مسؤول (باوند ٩)</span>
              </span>
              <p className="text-xs text-slate-100 font-bold">
                فوز بالكل: <span className="text-amber-300">+١٨</span>
              </p>
            </div>
            <span className="text-[10px] text-rose-300 font-semibold block mt-2 border-t border-white/10 pt-1">
              ⚠️ أي خسارة: +١٥ للخصم
            </span>
          </div>

          <div className="bg-black/50 border border-emerald-600/50 rounded-2xl p-3 flex flex-col justify-between">
            <div>
              <span className="text-[11px] text-emerald-300 font-black block mb-1 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>إنهاء الجولة</span>
              </span>
              <p className="text-xs text-slate-100 font-bold">
                فوز فوري: <span className="text-emerald-300">+{originalContract}</span>
              </p>
            </div>
            <span className="text-[10px] text-slate-400 block mt-2 border-t border-white/10 pt-1">
              حسم آمن
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full">
          <button
            type="button"
            onClick={onDeclareMasoul}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.6)] flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all ring-2 ring-amber-300"
          >
            <Crown className="w-4 h-4 fill-slate-950" />
            <span>مسؤول (باوند +١٨)</span>
          </button>

          <button
            type="button"
            onClick={onConcludeNormalWin}
            className="py-3 px-4 rounded-2xl bg-[#09221a] hover:bg-[#12362a] border border-emerald-600/70 text-emerald-200 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>إنهاء (+{originalContract})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
