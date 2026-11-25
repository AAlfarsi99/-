import React, { useState } from 'react';
import { GameStats } from '../types/settings';
import { PlayerId } from '../types/game';
import { PLAYER_NAMES, teamOf, SUIT_NAMES, isRed } from '../utils/gameLogic';
import { AvatarCharacter } from './AvatarCharacter';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  X,
  Trophy,
  Crown,
  Percent,
  History,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Award,
  ShieldAlert,
  BarChart2,
  CheckCircle2,
  XCircle,
  Flame,
} from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  playerNames?: [string, string, string, string];
  onResetStats: () => void;
}

const PLAYER_CHART_COLORS: Record<
  PlayerId,
  { stroke: string; badge: string; text: string; dot: string }
> = {
  0: {
    stroke: '#fbbf24',
    badge: 'bg-amber-400/15 border-amber-400/60',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
  },
  1: {
    stroke: '#f43f5e',
    badge: 'bg-rose-500/15 border-rose-500/60',
    text: 'text-rose-300',
    dot: 'bg-rose-500',
  },
  2: {
    stroke: '#10b981',
    badge: 'bg-emerald-500/15 border-emerald-500/60',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
  3: {
    stroke: '#38bdf8',
    badge: 'bg-sky-400/15 border-sky-400/60',
    text: 'text-sky-300',
    dot: 'bg-sky-400',
  },
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey?: string;
  }>;
  label?: string;
  valueSuffix?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  valueSuffix = '',
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="bg-[#051511]/95 border border-amber-500/60 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md z-50 text-right min-w-[140px]"
        dir="rtl"
      >
        <p className="font-black text-amber-300 border-b border-emerald-800/60 pb-1 text-center font-serif">
          {label}
        </p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-3 text-slate-200">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-semibold text-emerald-200/90">{entry.name}:</span>
              </span>
              <span className="font-black tabular-nums text-white">
                {entry.value}
                {valueSuffix}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  playerNames,
  onResetStats,
}) => {
  const [activeTab, setActiveTab] = useState<'charts' | 'players' | 'history'>('charts');
  const [contractProgressMode, setContractProgressMode] = useState<'cumulative' | 'winRate'>('cumulative');
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  if (!isOpen) return null;

  const getName = (id: PlayerId) =>
    (playerNames && playerNames[id]) || stats.players[id]?.name || PLAYER_NAMES[id];

  // Calculate top performers
  const playerList = ([0, 1, 2, 3] as PlayerId[]).map((id) => ({
    ...stats.players[id],
    name: getName(id),
  }));

  // Trick leader
  const trickLeader = [...playerList].sort((a, b) => b.tricksWon - a.tricksWon)[0];
  const hasTricks = trickLeader && trickLeader.tricksWon > 0;

  // Best bidder (min 1 bid attempted)
  const bidders = playerList.filter((p) => p.contractsBid > 0);
  const bestBidder =
    bidders.length > 0
      ? [...bidders].sort((a, b) => {
          const rateA = a.contractsWon / a.contractsBid;
          const rateB = b.contractsWon / b.contractsBid;
          if (rateB !== rateA) return rateB - rateA;
          return b.contractsWon - a.contractsWon;
        })[0]
      : null;

  // Best cutter detector (cheatsCaught)
  const cheatDetectorLeader = [...playerList].sort(
    (a, b) => (b.cheatsCaught || 0) - (a.cheatsCaught || 0)
  )[0];
  const hasCheatDetects = cheatDetectorLeader && (cheatDetectorLeader.cheatsCaught || 0) > 0;

  const totalTricks = Math.max(1, stats.totalTricks);

  // --------------------------------------------------------------------------
  // RECHARTS DATA PREPARATION
  // --------------------------------------------------------------------------
  // 1. Bidding & Contracts Success Data
  const biddingChartData = ([0, 1, 2, 3] as PlayerId[]).map((id) => {
    const p = stats.players[id];
    const name = getName(id);
    const winRate = p.contractsBid > 0 ? Math.round((p.contractsWon / p.contractsBid) * 100) : 0;
    return {
      id,
      name,
      contractsBid: p.contractsBid,
      contractsWon: p.contractsWon,
      contractsLost: p.contractsLost,
      winRate,
    };
  });

  // 2. Cut Detections & Tricks Won
  const detectionsChartData = ([0, 1, 2, 3] as PlayerId[]).map((id) => {
    const p = stats.players[id];
    const name = getName(id);
    return {
      id,
      name,
      cheatsCaught: p.cheatsCaught || 0,
      tricksWon: p.tricksWon || 0,
    };
  });

  // 3. Round Progression Timeline (earliest to latest)
  const historyTimelineData = [...stats.roundHistory]
    .reverse()
    .map((r, idx) => ({
      roundLabel: `ج${r.round || idx + 1}`,
      roundNum: r.round || idx + 1,
      team0Points: r.winningTeam === 0 ? r.points : 0,
      team1Points: r.winningTeam === 1 ? r.points : 0,
      contract: r.contract,
      reason: r.reason,
      bidderName: getName(r.bidder),
      isChallenge: Boolean(
        r.challengeSuccess || r.reason.includes('كشف') || r.reason.includes('مقاطعة')
      ),
    }));

  // 4. Contracts Winning Progression Over Time (per player, earliest to latest)
  const cumBids: Record<PlayerId, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const cumWins: Record<PlayerId, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const contractProgressionData = [...stats.roundHistory]
    .reverse()
    .map((r, idx) => {
      const buyer = r.bidder;
      const wonContract =
        r.reason.includes('نجاح') ||
        (r.winningTeam === teamOf(buyer) && !r.reason.includes('سقوط'));

      cumBids[buyer] += 1;
      if (wonContract) {
        cumWins[buyer] += 1;
      }

      const calcRate = (id: PlayerId) =>
        cumBids[id] > 0 ? Math.round((cumWins[id] / cumBids[id]) * 100) : null;

      return {
        roundLabel: `ج${r.round || idx + 1}`,
        roundNum: r.round || idx + 1,
        p0Won: cumWins[0],
        p1Won: cumWins[1],
        p2Won: cumWins[2],
        p3Won: cumWins[3],
        p0Rate: calcRate(0),
        p1Rate: calcRate(1),
        p2Rate: calcRate(2),
        p3Rate: calcRate(3),
      };
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-[#081b16] border-2 border-amber-400/80 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[96vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0d2a22] via-[#14392e] to-[#0d2a22] border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-inner">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-amber-300 font-serif flex items-center gap-2">
                <span>الإحصائيات</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
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

        {/* Global Summary KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-[#051310] border-b border-emerald-900/60">
          <div className="p-2 sm:p-2.5 rounded-xl bg-[#0a241c] border border-emerald-700/50 text-center">
            <span className="text-[10px] sm:text-xs text-emerald-300/80 block">الجولات</span>
            <strong className="text-base sm:text-xl font-black text-slate-100 tabular-nums">
              {stats.totalRounds}
            </strong>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-[#0a241c] border border-emerald-700/50 text-center">
            <span className="text-[10px] sm:text-xs text-emerald-300/80 block">اللمّات</span>
            <strong className="text-base sm:text-xl font-black text-amber-300 tabular-nums">
              {stats.totalTricks}
            </strong>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-[#0a241c] border border-emerald-700/50 text-center">
            <span className="text-[10px] sm:text-xs text-emerald-300/80 block">أعلى شراء</span>
            <strong className="text-base sm:text-xl font-black text-emerald-400 tabular-nums flex items-center justify-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{stats.highestContractMade > 0 ? stats.highestContractMade : '—'}</span>
            </strong>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-[#0a241c] border border-amber-600/50 text-center">
            <span className="text-[10px] sm:text-xs text-amber-300/80 block">صائد المقاطعات</span>
            <strong className="text-xs sm:text-sm font-black text-amber-300 flex items-center justify-center gap-1 mt-0.5 truncate">
              {hasCheatDetects ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">
                    {cheatDetectorLeader.name} ({cheatDetectorLeader.cheatsCaught || 0})
                  </span>
                </>
              ) : (
                '—'
              )}
            </strong>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-emerald-900/60 bg-[#071914] px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('charts')}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'charts'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-emerald-300/70 hover:text-emerald-200'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-amber-400" />
            <span>الرسوم البيانية</span>
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'players'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-emerald-300/70 hover:text-emerald-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>اللاعبون ({playerList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'history'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-emerald-300/70 hover:text-emerald-200'
            }`}
          >
            <History className="w-4 h-4 text-amber-300" />
            <span>السجل ({stats.roundHistory.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {/* ========================================================= */}
          {/* TAB 1: RECHARTS ANALYTICS & CHARTS                        */}
          {/* ========================================================= */}
          {activeTab === 'charts' && (
            <div className="space-y-5">
              {/* NEW Chart 0: Contract Winning Progression Over Time (4 Players, High-Contrast Colors) */}
              <div className="p-4 rounded-2xl bg-[#092019] border border-amber-500/40 shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-850 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-950 border border-amber-500/50">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <span>تطور الفوز بالشراء</span>
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                      </h3>
                    </div>
                  </div>

                  {/* Mode Switcher */}
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-emerald-800/60 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setContractProgressMode('cumulative')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        contractProgressMode === 'cumulative'
                          ? 'bg-amber-400 text-slate-950 shadow'
                          : 'text-emerald-200/80 hover:text-white'
                      }`}
                    >
                      الفوز التراكمي
                    </button>
                    <button
                      type="button"
                      onClick={() => setContractProgressMode('winRate')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        contractProgressMode === 'winRate'
                          ? 'bg-amber-400 text-slate-950 shadow'
                          : 'text-emerald-200/80 hover:text-white'
                      }`}
                    >
                      نسبة النجاح (%)
                    </button>
                  </div>
                </div>

                {/* Color-coded 4-player legend */}
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  {([0, 1, 2, 3] as PlayerId[]).map((pid) => (
                    <span
                      key={`prog-legend-${pid}`}
                      className={`px-2.5 py-0.5 rounded-full border font-bold flex items-center gap-1.5 ${PLAYER_CHART_COLORS[pid].badge} ${PLAYER_CHART_COLORS[pid].text}`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${PLAYER_CHART_COLORS[pid].dot}`} />
                      <span>{getName(pid)}</span>
                      {pid === 0 && <span className="opacity-80">(أنت)</span>}
                    </span>
                  ))}
                </div>

                {contractProgressionData.length > 0 ? (
                  <div className="h-64 w-full pt-1" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={contractProgressionData}
                        margin={{ top: 15, right: 14, left: -10, bottom: 15 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#16382c" vertical={false} />
                        <XAxis
                          dataKey="roundLabel"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#1f4e3e' }}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={11}
                          allowDecimals={false}
                          domain={contractProgressMode === 'winRate' ? [0, 100] : [0, 'auto']}
                          unit={contractProgressMode === 'winRate' ? '%' : ''}
                          tickLine={false}
                          axisLine={{ stroke: '#1f4e3e' }}
                        />
                        <Tooltip
                          content={
                            <CustomTooltip
                              valueSuffix={contractProgressMode === 'winRate' ? '%' : ''}
                            />
                          }
                        />
                        {([0, 1, 2, 3] as PlayerId[]).map((pid) => {
                          const dataKey =
                            contractProgressMode === 'cumulative' ? `p${pid}Won` : `p${pid}Rate`;
                          return (
                            <Line
                              key={`line-p-${pid}`}
                              type="monotone"
                              dataKey={dataKey}
                              name={getName(pid)}
                              stroke={PLAYER_CHART_COLORS[pid].stroke}
                              strokeWidth={pid === 0 ? 3.5 : 2.5}
                              dot={{ r: pid === 0 ? 4.5 : 3.5, strokeWidth: 1.5, fill: '#081b16' }}
                              activeDot={{ r: 6 }}
                              connectNulls
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 space-y-1">
                    <p className="text-xs text-emerald-300/70">
                      لا توجد بيانات بعد
                    </p>
                  </div>
                )}
              </div>

              {/* Chart 1: Bidding Success & Contracts Won vs Lost */}
              <div className="p-4 rounded-2xl bg-[#092019] border border-emerald-800/60 shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-850 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-600/50">
                      <Percent className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <span>نسبة نجاح الشراء</span>
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                      </h3>
                    </div>
                  </div>

                  {/* Summary Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      شراء ناجح
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                      سقوط الشراء
                    </span>
                  </div>
                </div>

                {/* Recharts BarChart */}
                <div className="h-64 w-full pt-1" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={biddingChartData}
                      margin={{ top: 15, right: 10, left: -10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#16382c" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#1f4e3e' }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={{ stroke: '#1f4e3e' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="contractsWon"
                        name="شراء ناجح"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={38}
                      />
                      <Bar
                        dataKey="contractsLost"
                        name="سقوط الشراء"
                        fill="#f43f5e"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={38}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Mini Win Rate Pills for each player */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-emerald-900/50">
                  {biddingChartData.map((b) => (
                    <div
                      key={b.id}
                      className="p-2 rounded-xl bg-[#061813] border border-emerald-800/40 text-center"
                    >
                      <span className="text-[10px] text-slate-300 flex items-center justify-center gap-1 truncate">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${PLAYER_CHART_COLORS[b.id].dot}`} />
                        <span className="truncate">{b.name}</span>
                      </span>
                      <strong
                        className={`text-sm sm:text-base font-black ${
                          b.contractsBid === 0
                            ? 'text-slate-500'
                            : b.winRate >= 70
                            ? 'text-emerald-400'
                            : b.winRate >= 50
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {b.contractsBid > 0 ? `${b.winRate}%` : '—'}
                      </strong>
                      <span className="text-[9px] text-emerald-400/60 block mt-0.5">
                        {b.contractsBid > 0 ? `${b.contractsWon} من ${b.contractsBid}` : 'بدون شراء'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 2: Successful Cut Detections (كشف المقاطعة) vs Tricks Won */}
              <div className="p-4 rounded-2xl bg-[#092019] border border-emerald-800/60 shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-850 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-950 border border-amber-600/50">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <span>كشف المقاطعة (+١٥) واللمّات</span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      كشف المقاطعات الناجحة
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      اللمّات المكسوبة
                    </span>
                  </div>
                </div>

                {/* Recharts BarChart for Detections */}
                <div className="h-64 w-full pt-1" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={detectionsChartData}
                      margin={{ top: 15, right: 10, left: -10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#16382c" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#1f4e3e' }}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={{ stroke: '#1f4e3e' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="cheatsCaught"
                        name="كشف مقاطعة ناجحة (+15)"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={38}
                      >
                        {detectionsChartData.map((entry, index) => (
                          <Cell
                            key={`cell-cheat-${index}`}
                            fill={entry.cheatsCaught > 0 ? '#f59e0b' : '#334155'}
                          />
                        ))}
                      </Bar>
                      <Bar
                        dataKey="tricksWon"
                        name="اللمّات المكسوبة"
                        fill="#38bdf8"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={38}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Player Detections Counter summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-emerald-900/50">
                  {detectionsChartData.map((d) => (
                    <div
                      key={d.id}
                      className="p-2 rounded-xl bg-[#061813] border border-emerald-800/40 text-center"
                    >
                      <span className="text-[10px] text-slate-300 block truncate">{d.name}</span>
                      <strong className="text-sm sm:text-base font-black text-amber-300 flex items-center justify-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        <span>{d.cheatsCaught} كشف</span>
                      </strong>
                      <span className="text-[9px] text-sky-400/70 block mt-0.5">
                        {d.tricksWon} لمّة فوز
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 3: Points Progression Over Round History */}
              <div className="p-4 rounded-2xl bg-[#092019] border border-emerald-800/60 shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-850 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-600/50">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <span>مسار النقاط</span>
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      فريقنا
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      المنافس
                    </span>
                  </div>
                </div>

                {historyTimelineData.length > 0 ? (
                  <div className="h-60 w-full pt-1" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={historyTimelineData}
                        margin={{ top: 15, right: 10, left: -10, bottom: 15 }}
                      >
                        <defs>
                          <linearGradient id="colorTeam0" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorTeam1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#16382c" vertical={false} />
                        <XAxis
                          dataKey="roundLabel"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#1f4e3e' }}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={11}
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={{ stroke: '#1f4e3e' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="team0Points"
                          name="نقاط فريقك"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorTeam0)"
                        />
                        <Area
                          type="monotone"
                          dataKey="team1Points"
                          name="نقاط المنافس"
                          stroke="#f43f5e"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorTeam1)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 space-y-1">
                    <p className="text-xs text-emerald-300/70">
                      لا توجد بيانات بعد
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: DETAILED PLAYER CARDS                              */}
          {/* ========================================================= */}
          {activeTab === 'players' && (
            <div className="space-y-4">
              {/* Comparative Trick Share Bar */}
              {stats.totalTricks > 0 && (
                <div className="p-3 sm:p-4 rounded-2xl bg-[#092019] border border-emerald-800/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-200">
                    <span className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>توزيع اللمّات بين اللاعبين ({stats.totalTricks} لمّة)</span>
                    </span>
                  </div>
                  {/* Visual stacked percentage bar */}
                  <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-900 border border-emerald-700/50">
                    {playerList.map((p, idx) => {
                      const pct = (p.tricksWon / totalTricks) * 100;
                      if (pct <= 0) return null;
                      const colors = [
                        'bg-amber-400 text-slate-950',
                        'bg-rose-500 text-white',
                        'bg-emerald-400 text-slate-950',
                        'bg-sky-400 text-slate-950',
                      ];
                      return (
                        <div
                          key={p.id}
                          style={{ width: `${pct}%` }}
                          title={`${p.name}: ${p.tricksWon} لمّة (${Math.round(pct)}%)`}
                          className={`${colors[idx]} h-full transition-all duration-300 relative group flex items-center justify-center text-[9px] font-black`}
                        >
                          {pct >= 10 && `${Math.round(pct)}%`}
                        </div>
                      );
                    })}
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1">
                    {playerList.map((p, idx) => {
                      const dotColors = [
                        'bg-amber-400',
                        'bg-rose-500',
                        'bg-emerald-400',
                        'bg-sky-400',
                      ];
                      return (
                        <div key={p.id} className="flex items-center gap-1 text-slate-200">
                          <span className={`w-2.5 h-2.5 rounded-full ${dotColors[idx]}`} />
                          <span className="font-semibold">{p.name}:</span>
                          <span className="text-amber-300 font-bold">{p.tricksWon}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Individual Detailed Cards for Each Player */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {playerList.map((player) => {
                  const isUser = player.id === 0;
                  const isLeader = hasTricks && trickLeader.id === player.id;
                  const isTopBidder = bestBidder && bestBidder.id === player.id;
                  const teamNum = teamOf(player.id);

                  // Calculate Contract Success Rate
                  const successRate =
                    player.contractsBid > 0
                      ? Math.round((player.contractsWon / player.contractsBid) * 100)
                      : null;

                  const trickPercentage =
                    stats.totalTricks > 0
                      ? Math.round((player.tricksWon / stats.totalTricks) * 100)
                      : 0;

                  return (
                    <div
                      key={player.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                        isUser
                          ? 'bg-gradient-to-br from-[#12362b] to-[#0a2019] border-amber-400/80 shadow-[0_4px_20px_rgba(251,191,36,0.15)]'
                          : 'bg-[#092019] border-emerald-800/60'
                      }`}
                    >
                      {/* Top Player Info */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <AvatarCharacter id={player.id} size="sm" isWinner={isLeader} />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-sm sm:text-base text-slate-100">
                                  {player.name}
                                </h3>
                                {isUser && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black">
                                    أنت
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-emerald-300/80 block">
                                {teamNum === 0 ? 'فريقنا' : 'المنافس'}
                              </span>
                            </div>
                          </div>

                          {/* Honor Badges */}
                          <div className="flex flex-col items-end gap-1">
                            {isLeader && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/60 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                                <Award className="w-3 h-3 text-amber-400" />
                                <span>بطل اللمّات</span>
                              </span>
                            )}
                            {isTopBidder && player.contractsBid > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/60 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                                <Crown className="w-3 h-3 text-emerald-400" />
                                <span>قنّاص الشراء</span>
                              </span>
                            )}
                            {(player.cheatsCaught || 0) > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/60 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3 text-amber-400" />
                                <span>{player.cheatsCaught} كشف</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Core Stats: Tricks Won & Bid Success Rate */}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {/* 1. TRICKS WON */}
                          <div className="p-2.5 rounded-xl bg-[#061813] border border-emerald-800/40 text-center">
                            <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-200/90 font-medium">
                              <Trophy className="w-3 h-3 text-amber-400" />
                              <span>اللمّات</span>
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-amber-300 tabular-nums mt-0.5">
                              {player.tricksWon}
                            </div>
                            <span className="text-[10px] text-emerald-300/70 block mt-0.5">
                              {trickPercentage}%
                            </span>
                          </div>

                          {/* 2. CONTRACT SUCCESS RATE */}
                          <div className="p-2.5 rounded-xl bg-[#061813] border border-emerald-800/40 text-center">
                            <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-200/90 font-medium">
                              <Percent className="w-3 h-3 text-emerald-400" />
                              <span>نجاح الشراء</span>
                            </div>
                            <div
                              className={`text-xl sm:text-2xl font-black tabular-nums mt-0.5 ${
                                successRate === null
                                  ? 'text-slate-400'
                                  : successRate >= 70
                                  ? 'text-emerald-300'
                                  : successRate >= 50
                                  ? 'text-amber-300'
                                  : 'text-rose-400'
                              }`}
                            >
                              {successRate !== null ? `${successRate}%` : '—'}
                            </div>
                            <span className="text-[10px] text-emerald-300/70 block mt-0.5">
                              {player.contractsBid > 0
                                ? `${player.contractsWon}/${player.contractsBid}`
                                : '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Sub-stats pill list */}
                      <div className="mt-3 pt-2.5 border-t border-emerald-900/60 flex items-center justify-between text-[11px] text-emerald-200/80">
                        <span>
                          شراء: <strong className="text-slate-100">{player.contractsBid}</strong>
                        </span>
                        <span>
                          نجح: <strong className="text-emerald-300">{player.contractsWon}</strong>
                        </span>
                        <span>
                          سقط: <strong className="text-rose-400">{player.contractsLost}</strong>
                        </span>
                        <span>
                          كشف: <strong className="text-amber-300">{player.cheatsCaught || 0}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: ROUND HISTORY LOG                                  */}
          {/* ========================================================= */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {stats.roundHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <History className="w-10 h-10 mx-auto text-emerald-700/60" />
                  <p className="text-sm font-semibold">لا يوجد سجل بعد</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.roundHistory.map((item, idx) => {
                    const isWinningTeamUs = item.winningTeam === 0;
                    const buyerName = getName(item.bidder);
                    const isChallengeRound =
                      item.challengeSuccess !== undefined ||
                      item.reason.includes('كشف') ||
                      item.reason.includes('مقاطعة');

                    return (
                      <div
                        key={idx}
                        className={`p-3 sm:p-3.5 rounded-2xl bg-[#092019] border flex items-center justify-between gap-3 text-xs ${
                          isChallengeRound
                            ? 'border-amber-500/60 bg-gradient-to-r from-[#0d2a22] to-[#1a1408]'
                            : 'border-emerald-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center font-black text-amber-300 text-xs shrink-0">
                            ج{item.round}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-slate-100 flex-wrap">
                              <span>
                                المشتري: {buyerName} ({item.contract})
                              </span>
                              {item.trump && (
                                <span
                                  className={`font-serif font-black ${
                                    isRed(item.trump) ? 'text-[#e11d48]' : 'text-slate-100'
                                  }`}
                                >
                                  [{item.trump} {SUIT_NAMES[item.trump]}]
                                </span>
                              )}
                              {isChallengeRound && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[9px] flex items-center gap-0.5">
                                  <ShieldAlert className="w-2.5 h-2.5" />
                                  <span>ضبط مقاطعة</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-emerald-300/80 block mt-0.5">
                              النتيجة: {item.reason}
                              {item.challenger !== undefined && (
                                <span className="text-amber-300 font-semibold mr-1">
                                  (الكاشف: {getName(item.challenger)})
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="text-left flex flex-col items-end shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-md font-black text-[11px] ${
                              isWinningTeamUs
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                                : 'bg-rose-950 text-rose-300 border border-rose-600/50'
                            }`}
                          >
                            {isWinningTeamUs ? 'فوز فريقك' : 'فوز المنافس'}
                          </span>
                          <span className="text-[10px] text-amber-300 font-bold mt-1">
                            +{item.points} نقطة
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0a221b] border-t border-amber-500/20 flex items-center justify-between gap-3">
          {showConfirmReset ? (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <span className="text-xs text-rose-300 font-bold">
                تأكيد التصفير؟
              </span>
              <button
                type="button"
                onClick={() => {
                  onResetStats();
                  setShowConfirmReset(false);
                }}
                className="py-1 px-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg transition-transform active:scale-95 cursor-pointer"
              >
                نعم
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmReset(true)}
              className="px-3 py-2 rounded-xl bg-slate-800/70 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-transparent hover:border-rose-800/40 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
