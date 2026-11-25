import React, { useState } from 'react';
import { GameSettings, TableColor, CardBackStyle, Difficulty } from '../types/settings';
import { CardView } from './CardView';
import { AvatarCharacter } from './AvatarCharacter';
import { DEFAULT_PLAYER_NAMES } from '../utils/storage';
import { PlayerId } from '../types/game';
import {
  X,
  Palette,
  Layers,
  Volume2,
  VolumeX,
  Zap,
  Check,
  RotateCcw,
  Sparkles,
  Users,
  User,
  Sliders,
  Wand2,
  Brain,
  Shield,
  Flame,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResetSettings: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'players' | 'gameplay'>('appearance');

  if (!isOpen) return null;

  const tableColorOptions: {
    id: TableColor;
    title: string;
    previewBg: string;
    borderGlow: string;
  }[] = [
    {
      id: 'green',
      title: 'الأخضر الكلاسيكي',
      previewBg: 'bg-[radial-gradient(ellipse_at_50%_50%,#247d5a_0%,#165b40_50%,#0c3828_100%)]',
      borderGlow: 'border-emerald-400 ring-emerald-400/40',
    },
    {
      id: 'blue',
      title: 'الأزرق الملكي',
      previewBg: 'bg-[radial-gradient(ellipse_at_50%_50%,#1e4976_0%,#133355_50%,#0c2037_100%)]',
      borderGlow: 'border-sky-400 ring-sky-400/40',
    },
    {
      id: 'burgundy',
      title: 'العنابي الإمبراطوري',
      previewBg: 'bg-[radial-gradient(ellipse_at_50%_50%,#7a1628_0%,#59101c_50%,#380811_100%)]',
      borderGlow: 'border-rose-400 ring-rose-400/40',
    },
  ];

  const cardBackOptions: {
    id: CardBackStyle;
    title: string;
  }[] = [
    {
      id: 'omani-khanjar',
      title: 'الخنجر العُماني',
    },
    {
      id: 'royal-blue',
      title: 'الأرابيسك الأزرق',
    },
    {
      id: 'crimson-damask',
      title: 'العنابي الكلاسيكي',
    },
    {
      id: 'emerald-luxury',
      title: 'الزمرد الخليجي',
    },
  ];

  const playerPositions: {
    id: PlayerId;
    roleLabel: string;
    seatPos: string;
    teamText: string;
    teamClass: string;
  }[] = [
    {
      id: 0,
      roleLabel: 'أنت',
      seatPos: 'أسفل',
      teamText: 'فريقنا',
      teamClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50',
    },
    {
      id: 1,
      roleLabel: 'المياسي',
      seatPos: 'يمين',
      teamText: 'المنافس',
      teamClass: 'bg-amber-950/80 text-amber-300 border-amber-600/50',
    },
    {
      id: 2,
      roleLabel: 'سيف',
      seatPos: 'أعلى (شريك)',
      teamText: 'فريقنا',
      teamClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50',
    },
    {
      id: 3,
      roleLabel: 'مروان',
      seatPos: 'يسار',
      teamText: 'المنافس',
      teamClass: 'bg-amber-950/80 text-amber-300 border-amber-600/50',
    },
  ];

  const handlePlayerNameChange = (id: PlayerId, value: string) => {
    const updatedNames = [...settings.playerNames] as [string, string, string, string];
    updatedNames[id] = value;
    onUpdateSettings({ playerNames: updatedNames });
  };

  const applyNamePreset = (presetNames: [string, string, string, string]) => {
    onUpdateSettings({ playerNames: [...presetNames] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#081b16] border-2 border-amber-400/70 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[96vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0d2a22] via-[#12362b] to-[#0d2a22] border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-amber-300 font-serif">
                الإعدادات
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="p-2 rounded-xl bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-emerald-900/60 bg-[#061813] px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`pb-2.5 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'appearance'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-emerald-300/70 hover:text-emerald-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>المظهر</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('players')}
            className={`pb-2.5 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'players'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-emerald-300/70 hover:text-emerald-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>اللاعبون</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gameplay')}
            className={`pb-2.5 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'gameplay'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-emerald-300/70 hover:text-emerald-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>اللعب</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ================= TAB 1: APPEARANCE ================= */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* SECTION 1: Table Felt Color */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-amber-200 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-400" />
                    <span>الطاولة</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {tableColorOptions.map((opt) => {
                    const isSelected = settings.tableColor === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onUpdateSettings({ tableColor: opt.id })}
                        className={`relative p-3 rounded-2xl border-2 text-right transition-all flex flex-col justify-between overflow-hidden group cursor-pointer ${
                          isSelected
                            ? `${opt.borderGlow} bg-[#113227] ring-2 shadow-[0_0_15px_rgba(251,191,36,0.25)]`
                            : 'border-emerald-800/50 bg-[#091c16]/80 hover:border-emerald-600/70'
                        }`}
                      >
                        {/* Visual Preview Felt Swatch */}
                        <div
                          className={`w-full h-14 rounded-xl ${opt.previewBg} border border-amber-300/40 relative mb-2.5 shadow-inner flex items-center justify-center overflow-hidden`}
                        >
                          <div className="w-[85%] h-[75%] rounded-lg border border-amber-300/25 pointer-events-none" />
                          <span className="absolute text-xs opacity-40">🇴🇲</span>
                          {isSelected && (
                            <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-amber-200">
                            {opt.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* SECTION 2: Card Back Patterns */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-amber-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>ظهر الورقة</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {cardBackOptions.map((opt) => {
                    const isSelected = settings.cardBackStyle === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onUpdateSettings({ cardBackStyle: opt.id })}
                        className={`relative p-3 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-between gap-2 cursor-pointer group ${
                          isSelected
                            ? 'border-amber-400 bg-[#12382b] ring-2 ring-amber-400/40 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                            : 'border-emerald-800/50 bg-[#091c16]/80 hover:border-emerald-600/70'
                        }`}
                      >
                        {/* Live Card View Component Back */}
                        <div className="py-1">
                          <CardView faceDown cardBackStyle={opt.id} size="md" />
                        </div>

                        <div className="w-full text-center">
                          <span className="text-xs font-bold text-slate-100 block group-hover:text-amber-300">
                            {opt.title}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="w-full mt-1 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-extrabold flex items-center justify-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>محدد</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* ================= TAB 2: PLAYER NAMES ================= */}
          {activeTab === 'players' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>أسماء اللاعبين</span>
                </h3>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] text-emerald-300/80 font-medium flex items-center gap-1">
                    <Wand2 className="w-3 h-3 text-amber-400" />
                    <span>نماذج:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => applyNamePreset(['أنت', 'المياسي', 'سيف', 'مروان'])}
                    className="px-2 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-200 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    الافتراضية
                  </button>
                  <button
                    type="button"
                    onClick={() => applyNamePreset(['أنت', 'سعيد', 'سالم', 'حمد'])}
                    className="px-2 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-200 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    عُمانية
                  </button>
                  <button
                    type="button"
                    onClick={() => applyNamePreset(['القائد', 'الذيب', 'الصقر', 'الجاسور'])}
                    className="px-2 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-200 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    ألقاب
                  </button>
                </div>
              </div>

              {/* 4 Player Name Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {playerPositions.map((pos) => {
                  const currentVal = settings.playerNames[pos.id] || '';
                  return (
                    <div
                      key={pos.id}
                      className="p-3.5 rounded-2xl bg-[#091c16] border border-emerald-800/60 flex flex-col gap-2 hover:border-emerald-600/80 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AvatarCharacter id={pos.id} size="sm" />
                          <div>
                            <span className="text-xs font-bold text-slate-100 block">
                              {pos.roleLabel}
                            </span>
                            <span className="text-[10px] text-emerald-300/70 block">
                              {pos.seatPos}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${pos.teamClass}`}>
                          {pos.teamText}
                        </span>
                      </div>

                      {/* Text Input */}
                      <div className="relative mt-1">
                        <input
                          type="text"
                          maxLength={18}
                          value={currentVal}
                          onChange={(e) => handlePlayerNameChange(pos.id, e.target.value)}
                          placeholder={`أدخل اسم ${pos.roleLabel}...`}
                          className="w-full py-2 px-3 pl-8 rounded-xl bg-[#061410] border border-emerald-700/70 text-slate-100 placeholder:text-emerald-700 text-xs sm:text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                        />
                        {currentVal && (
                          <button
                            type="button"
                            onClick={() => handlePlayerNameChange(pos.id, DEFAULT_PLAYER_NAMES[pos.id])}
                            title="استعادة الاسم الافتراضي"
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-300 text-xs transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ================= TAB 3: GAMEPLAY & SOUND ================= */}
          {activeTab === 'gameplay' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Difficulty Section */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-amber-200 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-amber-400" />
                    <span>مستوى الذكاء</span>
                  </span>
                  <span className="text-[11px] text-amber-300/80 font-bold">
                    {settings.difficulty === 'hard'
                      ? 'محترف ⭐⭐⭐'
                      : settings.difficulty === 'medium'
                      ? 'متوسط ⭐⭐'
                      : 'سهل ⭐'}
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'easy' as Difficulty,
                      label: 'سهل',
                      stars: '⭐',
                      desc: 'مزايدة متحفظة',
                      borderActive: 'border-emerald-400 ring-2 ring-emerald-400/40 bg-[#0d2e23]',
                      badgeColor: 'text-emerald-300 bg-emerald-950/80 border-emerald-600/50',
                    },
                    {
                      id: 'medium' as Difficulty,
                      label: 'متوسط',
                      stars: '⭐⭐',
                      desc: 'لعب متوازن',
                      borderActive: 'border-amber-400 ring-2 ring-amber-400/40 bg-[#26200e]',
                      badgeColor: 'text-amber-300 bg-amber-950/80 border-amber-600/50',
                    },
                    {
                      id: 'hard' as Difficulty,
                      label: 'محترف',
                      stars: '⭐⭐⭐',
                      desc: 'تكتيك عالي وضبط دقيق',
                      borderActive: 'border-purple-400 ring-2 ring-purple-400/40 bg-[#25102c]',
                      badgeColor: 'text-purple-300 bg-purple-950/80 border-purple-600/50',
                    },
                  ].map((diff) => {
                    const isSelected = settings.difficulty === diff.id;
                    return (
                      <button
                        key={diff.id}
                        type="button"
                        onClick={() => onUpdateSettings({ difficulty: diff.id })}
                        className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? diff.borderActive
                            : 'border-emerald-900/40 bg-[#071913] hover:border-emerald-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${diff.badgeColor}`}>
                            {diff.label} {diff.stars}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          {diff.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="text-sm font-bold text-amber-200 flex items-center gap-2 pt-2 border-t border-emerald-900/40">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>الخيارات</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Sound Toggle */}
                <div className="p-3.5 rounded-2xl bg-[#091c16] border border-emerald-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
                      {settings.soundEnabled ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-100">
                      الصوت
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 flex items-center cursor-pointer ${
                      settings.soundEnabled ? 'bg-amber-400' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                        settings.soundEnabled ? 'translate-x-0' : '-translate-x-6'
                      }`}
                    />
                  </button>
                </div>

                {/* Fast Animations */}
                <div className="p-3.5 rounded-2xl bg-[#091c16] border border-emerald-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-100">
                      اللعب السريع
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ fastAnimations: !settings.fastAnimations })}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 flex items-center cursor-pointer ${
                      settings.fastAnimations ? 'bg-amber-400' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                        settings.fastAnimations ? 'translate-x-0' : '-translate-x-6'
                      }`}
                    />
                  </button>
                </div>

                {/* Apple Watch Mode Toggle */}
                <div className="p-3.5 rounded-2xl bg-[#091c16] border border-emerald-800/50 flex items-center justify-between sm:col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300 text-lg">
                      ⌚
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-100">
                      وضع الساعة (Watch)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ watchMode: !settings.watchMode })}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 flex items-center cursor-pointer ${
                      settings.watchMode ? 'bg-amber-400' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                        settings.watchMode ? 'translate-x-0' : '-translate-x-6'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0a221b] border-t border-amber-500/20 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onResetSettings}
            className="px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>افتراضي</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
};
