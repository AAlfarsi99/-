import React, { useState, useMemo } from 'react';
import { PlayerId, PlayHistoryItem, Suit } from '../types/game';
import { PLAYER_NAMES, SUITS, SUIT_NAMES, teamOf } from '../utils/gameLogic';
import { ShieldAlert, X, Check } from 'lucide-react';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  playHistory: PlayHistoryItem[];
  playerNames?: [string, string, string, string];
  onConfirmChallenge: (accusedPlayer: PlayerId, claimedSuit: Suit, trickNumber: number) => void;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  isOpen,
  onClose,
  playHistory,
  playerNames,
  onConfirmChallenge,
}) => {
  // Only opposing team players who had a required suit can be accused (playing a Joker is never a violation/cut)
  const challengeablePlays = useMemo(() => {
    return playHistory.filter((item) => teamOf(item.p) !== 0 && Boolean(item.required) && !item.c.j);
  }, [playHistory]);

  const availableTricks = useMemo(() => {
    const set = new Set<number>();
    challengeablePlays.forEach((p) => set.add(p.trick));
    return Array.from(set).sort((a, b) => a - b);
  }, [challengeablePlays]);

  const [selectedTrick, setSelectedTrick] = useState<number>(() => availableTricks[0] ?? 1);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerId | ''>('');
  const [selectedSuit, setSelectedSuit] = useState<Suit | ''>('');

  // Update players available for selected trick
  const playersForTrick = useMemo(() => {
    return challengeablePlays.filter((p) => p.trick === selectedTrick);
  }, [challengeablePlays, selectedTrick]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrick || selectedPlayer === '' || !selectedSuit) return;
    onConfirmChallenge(selectedPlayer as PlayerId, selectedSuit as Suit, selectedTrick);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[94vh] overflow-y-auto bg-gradient-to-b from-[#13382d] to-[#0a1e18] border-2 border-[#d4af37]/70 rounded-2xl p-3.5 sm:p-5 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-amber-300">كشف المقاطعة</h3>
            <p className="text-[11px] text-emerald-200/80">الصحيح: +١٥ لفريقك • الخاطئ: +١٥ للخصم وتنتهي الجولة</p>
          </div>
        </div>

        {challengeablePlays.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-300">
            لا توجد لمّات سابقة للكشف.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {/* Step 1: Select Trick Number */}
            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1">
                ١. اللمّة
              </label>
              <div className="grid grid-cols-4 gap-2">
                {availableTricks.map((trickNum) => (
                  <button
                    key={trickNum}
                    type="button"
                    onClick={() => {
                      setSelectedTrick(trickNum);
                      setSelectedPlayer('');
                    }}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      selectedTrick === trickNum
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md font-extrabold'
                        : 'bg-[#0f2d24] text-emerald-100 border-emerald-800/60 hover:bg-[#164134]'
                    }`}
                  >
                    لمّة {trickNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Accused Player */}
            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1">
                ٢. اللاعب
              </label>
              <div className="grid grid-cols-2 gap-2">
                {playersForTrick.map((play) => (
                  <button
                    key={play.p}
                    type="button"
                    onClick={() => setSelectedPlayer(play.p)}
                    className={`p-2.5 rounded-lg border text-right transition-all flex items-center justify-between ${
                      selectedPlayer === play.p
                        ? 'bg-amber-500 text-slate-950 border-amber-300 font-extrabold shadow-md'
                        : 'bg-[#0f2d24] text-emerald-100 border-emerald-800/60 hover:bg-[#164134]'
                    }`}
                  >
                    <span className="font-bold">{(playerNames && playerNames[play.p]) || PLAYER_NAMES[play.p]}</span>
                    <span className="text-xs opacity-80">
                      {play.c.j ? '🃏 جوكر' : `${play.c.r} ${play.c.s}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Select Reneged Suit */}
            <div>
              <label className="block text-xs font-semibold text-emerald-300 mb-1">
                ٣. النوع المقطوع
              </label>
              <div className="grid grid-cols-4 gap-2">
                {SUITS.map((suit) => {
                  const isSuitRed = suit === '♥' || suit === '♦';
                  return (
                    <button
                      key={suit}
                      type="button"
                      onClick={() => setSelectedSuit(suit)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        selectedSuit === suit
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-md'
                          : isSuitRed
                          ? 'bg-[#1a0c10] text-[#e11d48] border-red-500/40 hover:bg-red-950/40'
                          : 'bg-[#0f2d24] text-emerald-100 border-emerald-800/60 hover:bg-[#164134]'
                      }`}
                    >
                      <div
                        className={`text-2xl font-serif font-black ${
                          selectedSuit === suit ? 'text-slate-950' : isSuitRed ? 'text-[#e11d48]' : 'text-slate-200'
                        }`}
                      >
                        {suit}
                      </div>
                      <div
                        className={`text-[11px] font-bold ${
                          selectedSuit === suit ? 'text-slate-950' : isSuitRed ? 'text-red-400' : 'text-emerald-200'
                        }`}
                      >
                        {SUIT_NAMES[suit]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confirm Actions */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={!selectedTrick || selectedPlayer === '' || !selectedSuit}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد الكشف (+١٥)</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-[#0a231c] hover:bg-[#12362c] text-emerald-300 font-semibold rounded-xl border border-emerald-800/60 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
