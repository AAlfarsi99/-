import React, { useEffect } from 'react';
import { RoundEndDetails, PlayerId, Suit } from '../types/game';
import { formatRank } from '../utils/gameLogic';
import confetti from 'canvas-confetti';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { Trophy, Frown, Sparkles, ArrowLeft, RefreshCw, Swords, Flame, Lightbulb, BarChart3 } from 'lucide-react';

interface RoundSummaryModalProps {
  isOpen: boolean;
  round: number;
  scores: [number, number]; // [us, them]
  details: RoundEndDetails | null;
  playerNames?: [string, string, string, string];
  bidder?: PlayerId | null;
  contract?: number;
  trump?: Suit | null;
  onNextRound: () => void;
}

const SUIT_ICONS: Record<Suit, { sym: string; color: string; label: string }> = {
  '♠': { sym: '♠', color: 'text-slate-900', label: 'سبيت' },
  '♥': { sym: '♥', color: 'text-red-500', label: 'هاص' },
  '♦': { sym: '♦', color: 'text-red-500', label: 'ديمن' },
  '♣': { sym: '♣', color: 'text-slate-900', label: 'كلفس' },
};

export const RoundSummaryModal: React.FC<RoundSummaryModalProps> = ({
  isOpen,
  round,
  scores,
  details,
  playerNames,
  bidder,
  contract,
  trump,
  onNextRound,
}) => {
  useEffect(() => {
    if (isOpen && details && details.winningTeam === 0) {
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d4af37', '#10b981', '#ffffff', '#f59e0b'],
        });
      } catch {
        // Fallback gracefully
      }
    }
  }, [isOpen, details]);

  if (!isOpen || !details) return null;

  const userWon = details.winningTeam === 0;
  const stats = details.stats;

  const getPlayerLabel = (p: PlayerId) => {
    if (playerNames && playerNames[p]) return playerNames[p];
    if (p === 0) return 'أنت';
    if (p === 1) return 'المنافس ١';
    if (p === 2) return 'الشريك';
    return 'المنافس ٢';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-lg max-h-[94vh] overflow-y-auto bg-gradient-to-b from-[#12362c] via-[#0c2720] to-[#081813] border-2 border-[#d4af37] rounded-3xl p-4 sm:p-6 shadow-2xl text-center text-slate-100">
        {/* Decorative corner glow */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Icon Header */}
        <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg border relative bg-gradient-to-br from-[#1c483b] to-[#0c241c] border-amber-400/50">
          {userWon ? (
            <Trophy className="w-8 h-8 sm:w-9 sm:h-9 text-amber-300 drop-shadow animate-bounce" />
          ) : (
            <Frown className="w-8 h-8 sm:w-9 sm:h-9 text-amber-400/80" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-black text-amber-300 mb-0.5">
          {userWon ? 'فوز فريقنا' : 'فوز المنافس'}
        </h2>
        <div className="text-xs text-emerald-200/80 mb-3 sm:mb-4">
          جولة {round}
          {contract && bidder !== null && bidder !== undefined && trump && (
            <span className="mr-2 text-amber-300/90 font-medium">
              ({details.isBound ? (details.isMasoul ? 'باوند مسؤول' : 'باوند') : `شراء ${contract}`} • {getPlayerLabel(bidder)} • {SUIT_ICONS[trump]?.label || trump})
            </span>
          )}
        </div>

        {/* Outcome Description Card */}
        <div className="bg-[#0b241d]/90 border border-emerald-700/50 rounded-2xl p-3.5 sm:p-4 mb-4 text-right shadow-inner">
          <div className="font-extrabold text-sm text-amber-300 mb-1 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">{details.message}</span>
            </div>
            {details.isBound && (
              <span className="text-[10px] bg-gradient-to-r from-amber-500/30 to-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/60 font-black shrink-0 shadow-sm animate-pulse">
                {details.isMasoul ? '👑 باوند مسؤول (+١٨)' : '👑 باوند (+١٨)'}
              </span>
            )}
            {details.reason === 'trapped_joker_lead_violation' && (
              <span className="text-[10px] bg-red-950/90 text-rose-300 px-2.5 py-0.5 rounded-full border border-red-500/70 font-black shrink-0 shadow-sm animate-pulse">
                🃏 حبس الجوكر الأخير (+١٥)
              </span>
            )}
          </div>
          <div className="text-xs text-emerald-100/90 leading-relaxed mb-2.5">
            {details.details}
          </div>
          <div className="pt-2 border-t border-emerald-800/60 flex items-center justify-between text-xs font-semibold">
            <span className="text-emerald-300">النقاط:</span>
            <span className="text-amber-300 font-extrabold text-base">+{details.pointsAwarded}</span>
          </div>
        </div>

        {/* Cumulative Scores Summary */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4">
          <div className={`p-3 rounded-xl border text-right sm:text-center ${userWon ? 'bg-emerald-950/70 border-emerald-500/60' : 'bg-[#0d2820] border-emerald-800/40'}`}>
            <span className="block text-[11px] sm:text-xs text-emerald-200/80 mb-0.5">
              فريقنا ({getPlayerLabel(0)} + {getPlayerLabel(2)})
            </span>
            <strong className="text-2xl font-black text-amber-300 tabular-nums">{scores[0]}</strong>
          </div>
          <div className={`p-3 rounded-xl border text-right sm:text-center ${!userWon ? 'bg-amber-950/70 border-amber-500/60' : 'bg-[#0d2820] border-emerald-800/40'}`}>
            <span className="block text-[11px] sm:text-xs text-emerald-200/80 mb-0.5">
              المنافس ({getPlayerLabel(1)} + {getPlayerLabel(3)})
            </span>
            <strong className="text-2xl font-black text-amber-300 tabular-nums">{scores[1]}</strong>
          </div>
        </div>

        {/* NEW: Round Statistics & Most Cuts (إحصائيات الجولة وأكثر مقاطعة) */}
        {stats && (
          <div className="bg-[#081f18]/90 border border-emerald-600/40 rounded-2xl p-3 sm:p-4 mb-5 text-right shadow-lg">
            <div className="flex items-center justify-between mb-3 border-b border-emerald-800/60 pb-2">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-300">
                <Swords className="w-4 h-4 text-amber-400" />
                <span>إحصائيات ج{round}</span>
              </div>
              <span className="text-[11px] text-emerald-300/80 bg-emerald-900/40 px-2 py-0.5 rounded-md border border-emerald-700/40">
                {stats.totalTricksPlayed} لمّات
              </span>
            </div>

            {/* Most Cuts Feature Highlight */}
            <div className="bg-gradient-to-r from-amber-950/60 via-emerald-950/60 to-amber-950/60 border border-amber-500/40 rounded-xl p-2.5 sm:p-3 mb-3 text-right">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="text-[11px] text-amber-200/90 font-medium">أكثر مقاطعة ⚔️</div>
                    <div className="text-xs sm:text-sm font-black text-amber-300">
                      {stats.mostCutsPlayer && stats.mostCutsPlayer.count > 0 ? (
                        stats.mostCutsPlayer.tied ? (
                          <span>تعادل: {stats.mostCutsPlayer.name}</span>
                        ) : (
                          <span>{stats.mostCutsPlayer.name}</span>
                        )
                      ) : (
                        <span className="text-emerald-300/80 font-normal">لا توجد مقاطعات</span>
                      )}
                    </div>
                  </div>
                </div>
                {stats.mostCutsPlayer && stats.mostCutsPlayer.count > 0 && (
                  <div className="px-2.5 py-1 bg-amber-400/20 border border-amber-400/60 rounded-lg text-amber-300 font-extrabold text-xs sm:text-sm tabular-nums whitespace-nowrap">
                    {stats.mostCutsPlayer.count} {stats.mostCutsPlayer.count === 1 ? 'مقاطعة' : stats.mostCutsPlayer.count === 2 ? 'مقاطعتان' : 'مقاطعات'}
                  </div>
                )}
              </div>

              {/* List of all cut plays in the round */}
              {stats.cutsDetails && stats.cutsDetails.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-amber-900/60">
                  <span className="text-[10px] text-amber-300/80 font-bold self-center ml-1">المقاطعات:</span>
                  {stats.cutsDetails.map((cut, idx) => (
                    <span
                      key={`all-cut-${idx}`}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-200 border border-amber-500/40 flex items-center gap-1 shadow-sm"
                    >
                      <span className="text-amber-300 font-bold">{getPlayerLabel(cut.player)}:</span>
                      <span>
                        ⚔️ {cut.isTrumpCut ? 'حكم' : ''} {formatRank(cut.card.r, cut.card.j)} {cut.card.s}
                      </span>
                      <span className="text-amber-400 font-semibold">(لمّة {cut.trick})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Players Breakdown 4-Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {([0, 1, 2, 3] as PlayerId[]).map((p) => {
                const tricksWon = stats.playerTricks[p] || 0;
                const cutsMade = stats.playerCuts[p] || 0;
                const isTopCutter =
                  stats.mostCutsPlayer &&
                  stats.mostCutsPlayer.count > 0 &&
                  cutsMade === stats.mostCutsPlayer.count;
                const isBidder = bidder === p;
                const isPartner = p === 2;
                const isUser = p === 0;
                const team = p === 0 || p === 2 ? 0 : 1;
                const playerCutDetails = stats.cutsDetails?.filter((c) => c.player === p) || [];

                return (
                  <div
                    key={p}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isTopCutter
                        ? 'bg-amber-950/30 border-amber-400/60 shadow-sm'
                        : team === 0
                        ? 'bg-[#0e2c22]/70 border-emerald-700/40'
                        : 'bg-[#15231e]/70 border-slate-700/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-bold text-slate-100 truncate text-[12px]">
                          {getPlayerLabel(p)}
                        </span>
                        {isUser && (
                          <span className="text-[9px] px-1 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                            أنت
                          </span>
                        )}
                        {isPartner && (
                          <span className="text-[9px] px-1 bg-teal-500/20 text-teal-300 rounded border border-teal-500/30">
                            الشريك
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                        team === 0 ? 'bg-emerald-900/60 text-emerald-300' : 'bg-slate-800/60 text-slate-300'
                      }`}>
                        {team === 0 ? 'فريقك' : 'المنافس'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px] pt-1 border-t border-emerald-900/50">
                      <div>
                        <span className="text-emerald-300/70 block text-[10px]">اللمّات:</span>
                        <strong className="text-amber-300 font-bold tabular-nums">{tricksWon}</strong>
                      </div>
                      <div>
                        <span className="text-emerald-300/70 block text-[10px]">المقاطعات:</span>
                        <strong className={`font-bold tabular-nums ${isTopCutter && cutsMade > 0 ? 'text-amber-300 font-extrabold' : 'text-slate-200'}`}>
                          {cutsMade} {isTopCutter && cutsMade > 0 ? '⚔️' : ''}
                        </strong>
                      </div>
                    </div>

                    {/* Roles/Joker & Cut played badges */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {isBidder && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          المشتري ({contract})
                        </span>
                      )}
                      {stats.jokersPlayed?.black?.player === p && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-700">
                          🃏 الجوكر الأسود (لمّة {stats.jokersPlayed.black.trick})
                        </span>
                      )}
                      {stats.jokersPlayed?.red?.player === p && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-700/50">
                          🃏 الجوكر الأحمر (لمّة {stats.jokersPlayed.red.trick})
                        </span>
                      )}
                      {/* Cuts made by this player shown exactly like Joker badges */}
                      {playerCutDetails.map((cut, idx) => (
                        <span
                          key={`cut-${p}-${idx}`}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-200 border border-amber-500/50 flex items-center gap-1 shadow-sm"
                        >
                          <span>
                            ⚔️ {cut.isTrumpCut ? 'قاطع بحكم' : 'قاطع بـ'} {formatRank(cut.card.r, cut.card.j)} {cut.card.s}
                          </span>
                          <span className="text-amber-400 font-bold">(لمّة {cut.trick})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Player Hand Distribution Analysis & Tactical Tip */}
        {stats?.handAnalysis && (
          <div className="bg-[#081f18]/95 border border-amber-500/40 rounded-2xl p-3 sm:p-4 mb-5 text-right shadow-lg space-y-3">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/60 pb-2">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-300">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>تحليل اليد</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] bg-emerald-950/90 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-700/50 font-bold">
                  التقدير: ~{stats.handAnalysis.estimatedTricks} لمّات
                </span>
                {stats.handAnalysis.voidSuitsCount > 0 && (
                  <span className="text-[10px] bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/40 font-bold">
                    {stats.handAnalysis.voidSuitsCount} فراغ
                  </span>
                )}
              </div>
            </div>

            {/* Chart 1: Suit Distribution Simple BarChart */}
            <div>
              <div className="text-[11px] text-emerald-200/80 font-semibold mb-1.5 flex items-center justify-between">
                <span>توزيع الأنواع</span>
                {trump && (
                  <span className="text-[10px] text-amber-300 font-bold">
                    الحكم: {SUIT_ICONS[trump]?.label} ({stats.handAnalysis.trumpCount})
                  </span>
                )}
              </div>

              <div className="h-36 w-full bg-[#051510]/80 rounded-xl border border-emerald-900/50 p-1.5" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.handAnalysis.suitDistribution}
                    margin={{ top: 8, right: 8, left: -24, bottom: 2 }}
                  >
                    <XAxis
                      dataKey="shortLabel"
                      stroke="#cbd5e1"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#1f4e3e' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={10}
                      allowDecimals={false}
                      domain={[0, 6]}
                      tickLine={false}
                      axisLine={{ stroke: '#1f4e3e' }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload as {
                          label: string;
                          count: number;
                          highCards: number;
                          isTrump: boolean;
                        };
                        return (
                          <div
                            dir="rtl"
                            className="bg-[#051510]/95 border border-amber-500/60 px-2.5 py-1.5 rounded-lg text-[11px] shadow-xl text-right"
                          >
                            <div className="font-bold text-amber-300">
                              {item.label} {item.isTrump ? '👑 (الحكم)' : ''}
                            </div>
                            <div className="text-slate-200">العدد: {item.count} أوراق</div>
                            {item.highCards > 0 && (
                              <div className="text-emerald-300">أوراق عالية: {item.highCards}</div>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={34}>
                      {stats.handAnalysis.suitDistribution.map((entry, idx) => {
                        let fill = '#38bdf8';
                        if (entry.suit === 'JOKER') fill = '#fbbf24';
                        else if (entry.isTrump) fill = '#10b981';
                        else if (entry.suit === '♥' || entry.suit === '♦') fill = '#f43f5e';
                        else fill = '#64748b';
                        return <Cell key={`suit-bar-${idx}`} fill={fill} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Visual Strength Tiers Stacked Bar */}
            {(() => {
              const { jokers, highHonors, midCards, lowCards } = stats.handAnalysis!.strengthBreakdown;
              const total = Math.max(1, jokers + highHonors + midCards + lowCards);
              const segments = [
                { key: 'jokers', label: 'جواكر', count: jokers, bg: 'bg-amber-400 text-slate-950', dot: 'bg-amber-400' },
                { key: 'high', label: 'عالية (A-K)', count: highHonors, bg: 'bg-emerald-400 text-slate-950', dot: 'bg-emerald-400' },
                { key: 'mid', label: 'وسط (Q-10)', count: midCards, bg: 'bg-sky-400 text-slate-950', dot: 'bg-sky-400' },
                { key: 'low', label: 'خفيفة (6-9)', count: lowCards, bg: 'bg-slate-600 text-slate-100', dot: 'bg-slate-500' },
              ];
              return (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-emerald-200/80 font-semibold">
                    توزيع القوة
                  </div>
                  <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-900 border border-emerald-800/60">
                    {segments.map((seg) => {
                      if (seg.count <= 0) return null;
                      const pct = (seg.count / total) * 100;
                      return (
                        <div
                          key={seg.key}
                          style={{ width: `${pct}%` }}
                          title={`${seg.label}: ${seg.count}`}
                          className={`${seg.bg} h-full flex items-center justify-center text-[9px] font-black transition-all`}
                        >
                          {seg.count}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-300">
                    {segments.map((seg) => (
                      <span key={`leg-${seg.key}`} className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${seg.dot}`} />
                        <span>{seg.label}:</span>
                        <strong className="text-amber-300">{seg.count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Tactical Tip Callout */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/60 via-[#0e2d23] to-emerald-950/60 border border-amber-400/50 flex items-start gap-2.5 shadow-inner">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/60 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-amber-300 mb-0.5">
                  {stats.handAnalysis.tacticalTip.title}
                </div>
                <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                  {stats.handAnalysis.tacticalTip.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Next Round Button */}
        <button
          onClick={onNextRound}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:brightness-105 active:scale-98 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl border border-amber-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-5 h-5 text-slate-900" />
          <span>الجولة التالية ({round + 1})</span>
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
