import React from 'react';
import { PlayerId, Phase, Suit } from '../types/game';
import { CardBackStyle } from '../types/settings';
import { PLAYER_NAMES, teamOf, isRed } from '../utils/gameLogic';
import { Crown, Sparkles, Trophy } from 'lucide-react';
import { AvatarCharacter } from './AvatarCharacter';
import { CardView } from './CardView';

interface PlayerSeatProps {
  id: PlayerId;
  isTurn: boolean;
  isDealer: boolean;
  isBidder: boolean;
  isTrickWinner?: boolean;
  cardCount: number;
  bid: number | null;
  contract: number;
  trump: Suit | null;
  phase: Phase;
  teamTricks: number;
  position: 'bottom' | 'top' | 'left' | 'right';
  name?: string;
  cardBackStyle?: CardBackStyle;
  isWatch?: boolean;
  isDealing?: boolean;
  isReceivingDeal?: boolean;
  isJustBid?: boolean;
  isHighestBidder?: boolean;
  className?: string;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  id,
  name,
  isTurn,
  isDealer,
  isBidder,
  isTrickWinner = false,
  cardCount,
  bid,
  contract,
  trump,
  phase,
  teamTricks,
  position,
  cardBackStyle = 'omani-khanjar',
  isWatch = false,
  isDealing = false,
  isReceivingDeal = false,
  isJustBid = false,
  isHighestBidder = false,
  className = '',
}) => {
  const isUser = id === 0;
  const teamNum = teamOf(id);
  const displayName = name || PLAYER_NAMES[id];

  // Helper for auction / play status text
  const renderStatusBadge = () => {
    if (isDealing) {
      return (
        <span className={`font-black inline-flex items-center gap-1 ${isReceivingDeal ? 'text-amber-300' : 'text-emerald-300/90'}`}>
          <span>{cardCount}/٩</span>
        </span>
      );
    }

    if (phase === 'auction') {
      if (bid === null) return <span className="text-slate-400">—</span>;
      if (bid === 0) return <span className="text-slate-300">طاف</span>;
      return (
        <span className={`font-black inline-flex items-center gap-0.5 ${isHighestBidder ? 'text-amber-300' : 'text-amber-200'}`}>
          {isHighestBidder && <Crown className="w-2.5 h-2.5 text-amber-400 shrink-0" />}
          <span>{bid}</span>
        </span>
      );
    }

    if (isBidder) {
      return (
        <span className="text-amber-300 font-black inline-flex items-center gap-1 bg-amber-950/60 px-1.5 py-0.2 rounded-full border border-amber-500/40">
          <Crown className="w-2.5 h-2.5 text-amber-400 shrink-0" />
          <span>{contract}</span>
          {trump && (
            <span className={`font-serif ${isRed(trump) ? 'text-red-400' : 'text-slate-100'}`}>
              {trump}
            </span>
          )}
        </span>
      );
    }

    if (!isUser) {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-300/90 font-medium">
          <span className="w-2.5 h-3.5 inline-block overflow-hidden rounded-[1px] shadow-xs">
            <CardView faceDown cardBackStyle={cardBackStyle} size="sm" className="!w-2.5 !h-3.5 !border-0 scale-50 -translate-x-1 -translate-y-1" />
          </span>
          <span>{cardCount}</span>
        </span>
      );
    }

    return <span className="text-emerald-300/80 font-medium">{cardCount}</span>;
  };

  // ================= APPLE WATCH COMPACT SEAT =================
  if (isWatch) {
    return (
      <div
        id={`seat-${id}`}
        className={`relative flex flex-col items-center justify-center select-none pointer-events-auto ${className}`}
      >
        {isTrickWinner && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none whitespace-nowrap">
            <span className="bg-amber-400 text-slate-950 px-1 py-0.2 rounded-full font-black text-[7px] shadow">
              +١
            </span>
          </div>
        )}

        {isReceivingDeal && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none whitespace-nowrap">
            <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-black text-[7.5px] shadow animate-bounce">
              +٣
            </span>
          </div>
        )}

        <div
          className={`relative z-10 px-1.5 py-0.5 rounded-lg transition-all duration-200 text-center max-w-[66px] ${
            isTrickWinner
              ? 'ring-2 ring-amber-400 bg-[#215d48] scale-105'
              : isJustBid
              ? 'ring-2 ring-amber-300 bg-[#2a5422] shadow-[0_0_14px_rgba(251,191,36,0.85)] scale-105'
              : isReceivingDeal
              ? 'ring-2 ring-amber-300 bg-[#1e5440] shadow-[0_0_10px_rgba(251,191,36,0.75)] scale-105'
              : isTurn
              ? 'bg-[#184837] ring-1 ring-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
              : isHighestBidder
              ? 'bg-[#17392c] ring-1 ring-amber-400/80'
              : 'bg-black/75 border border-emerald-700/60'
          }`}
        >
          {isDealer && (
            <span className="absolute -top-1.5 -right-1 bg-amber-500 text-slate-950 text-[7px] font-black px-1 rounded-full shadow-xs">
              م
            </span>
          )}

          <div className="flex items-center justify-center gap-0.5">
            <div className="scale-75 origin-center -m-0.5">
              <AvatarCharacter id={id} size="sm" isTurn={isTurn || isReceivingDeal} isWinner={isTrickWinner} />
            </div>
            <span className="font-black text-[9px] text-slate-100 truncate block max-w-[38px]">
              {displayName.split(' ')[0]}
            </span>
          </div>

          <div className="text-[8px] text-emerald-200/90 leading-tight mt-0.5 font-bold">
            {isDealing ? (
              <span className={isReceivingDeal ? 'text-amber-300 font-black' : 'text-emerald-300 font-bold'}>
                {cardCount}/٩
              </span>
            ) : phase === 'auction' ? (
              <span className="text-amber-300 font-black">
                {bid === null ? '...' : bid === 0 ? 'طاف' : `${bid}`}
              </span>
            ) : isBidder ? (
              <span className="text-amber-300 font-black inline-flex items-center justify-center gap-0.5">
                <Crown className="w-2 h-2" />
                <span>{contract}</span>
                <span className="text-[9px]">{trump}</span>
              </span>
            ) : (
              <span className="text-emerald-300 font-bold">{cardCount}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= TOP & BOTTOM PLAYERS (HORIZONTAL SLEEK CAPSULES) =================
  if (position === 'top' || position === 'bottom') {
    return (
      <div
        id={`seat-${id}`}
        className={`relative flex items-center justify-center select-none pointer-events-auto transition-all duration-300 ${className}`}
      >
        {/* Floating Trick Win Celebration Badge */}
        {isTrickWinner && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 pointer-events-none whitespace-nowrap animate-trick-float">
            <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black text-[10px] shadow-[0_0_12px_rgba(251,191,36,0.9)] border border-white flex items-center gap-1">
              <Trophy className="w-2.5 h-2.5 text-slate-950 animate-bounce" />
              <span>+١ لمّة!</span>
            </div>
          </div>
        )}

        {/* Receiving 3-card Deal Badge */}
        {isReceivingDeal && !isTrickWinner && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none whitespace-nowrap">
            <div className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black text-[9.5px] shadow-[0_0_12px_rgba(251,191,36,0.9)] border border-white animate-bounce">
              +٣ أوراق
            </div>
          </div>
        )}

        <div
          className={`relative z-10 px-2.5 py-1 rounded-full backdrop-blur-md transition-all duration-300 flex items-center gap-2 max-w-[260px] sm:max-w-[300px] shadow-md
            ${
              isTrickWinner
                ? 'animate-winner-glow ring-2 ring-amber-400 bg-gradient-to-r from-[#215d48] to-[#123b2e] border border-amber-300'
                : isJustBid
                ? 'ring-2 ring-amber-300 bg-gradient-to-r from-[#2c4e1c] to-[#143d2a] border border-amber-200 shadow-[0_0_22px_rgba(251,191,36,0.85)] scale-105'
                : isReceivingDeal
                ? 'bg-[#1e5440]/95 border-2 border-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.75)] scale-105'
                : isTurn
                ? 'bg-[#184837]/90 border border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)] scale-102'
                : isHighestBidder
                ? 'bg-[#14392c]/90 border border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                : 'bg-black/60 hover:bg-black/75 border border-emerald-600/40'
            }
          `}
        >
          {/* Dealer tag */}
          {isDealer && (
            <span className="absolute -top-2 right-2 bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow border border-amber-200">
              موزّع
            </span>
          )}

          {/* Turn tag */}
          {isTurn && !isTrickWinner && !isDealing && (
            <span className="absolute -bottom-2 right-2 bg-amber-400 text-slate-950 text-[8px] font-extrabold px-1.5 py-0.2 rounded-full shadow animate-pulse flex items-center gap-0.5">
              <Sparkles className="w-2 h-2" />
              <span>دوره</span>
            </span>
          )}

          {/* Avatar */}
          <div className="shrink-0 scale-90 origin-center -m-1">
            <AvatarCharacter id={id} size="sm" isTurn={isTurn || isReceivingDeal} isWinner={isTrickWinner} />
          </div>

          {/* Player Name */}
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-bold text-xs text-slate-100 tracking-wide truncate max-w-[90px] sm:max-w-[120px]">
              {isUser ? (displayName === 'أنت' ? 'أنت' : displayName) : displayName}
            </span>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-3.5 bg-emerald-700/60 shrink-0" />

          {/* Status info pill */}
          <div className="text-[10px] sm:text-[11px] shrink-0 flex items-center gap-1.5">
            {renderStatusBadge()}
            {phase === 'play' && (
              <span className="text-[9px] text-amber-300/80 bg-black/40 px-1 py-0.2 rounded border border-emerald-900/50">
                {teamTricks}ل
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= LEFT & RIGHT PLAYERS (SLIM COMPACT VERTICAL BADGES) =================
  return (
    <div
      id={`seat-${id}`}
      className={`relative flex flex-col items-center justify-center select-none pointer-events-auto transition-all duration-300 ${className}`}
    >
      {/* Floating Trick Win Celebration Badge */}
      {isTrickWinner && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 pointer-events-none whitespace-nowrap animate-trick-float">
          <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black text-[10px] shadow-[0_0_12px_rgba(251,191,36,0.9)] border border-white flex items-center gap-1">
            <Trophy className="w-2.5 h-2.5 text-slate-950 animate-bounce" />
            <span>+١</span>
          </div>
        </div>
      )}

      {/* Receiving 3-card Deal Badge */}
      {isReceivingDeal && !isTrickWinner && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none whitespace-nowrap">
          <div className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black text-[9.5px] shadow-[0_0_12px_rgba(251,191,36,0.9)] border border-white animate-bounce">
            +٣
          </div>
        </div>
      )}

      {/* Slim vertical card that does not intrude into the card arena */}
      <div
        className={`relative z-10 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-xl backdrop-blur-md transition-all duration-300 w-[72px] sm:w-[84px] text-center shadow-md
          ${
            isTrickWinner
              ? 'animate-winner-glow ring-2 ring-amber-400 bg-gradient-to-b from-[#215d48] to-[#123b2e] border border-amber-300'
              : isJustBid
              ? 'ring-2 ring-amber-300 bg-gradient-to-b from-[#2c4e1c] to-[#143d2a] border border-amber-200 shadow-[0_0_22px_rgba(251,191,36,0.85)] scale-105'
              : isReceivingDeal
              ? 'bg-[#1e5440]/95 border-2 border-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.75)] scale-105'
              : isTurn
              ? 'bg-[#184837]/90 border border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)] scale-102'
              : isHighestBidder
              ? 'bg-[#14392c]/90 border border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
              : 'bg-black/60 hover:bg-black/75 border border-amber-700/40'
          }
        `}
      >
        {/* Dealer badge tag */}
        {isDealer && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded-full shadow border border-amber-200 whitespace-nowrap">
            موزّع
          </div>
        )}

        {/* Turn indicator */}
        {isTurn && !isTrickWinner && !isDealing && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[8px] font-extrabold px-1.5 py-0.2 rounded-full shadow animate-pulse whitespace-nowrap">
            دوره
          </div>
        )}

        {/* Avatar */}
        <div className="flex justify-center scale-85 origin-center -my-0.5">
          <AvatarCharacter id={id} size="sm" isTurn={isTurn || isReceivingDeal} isWinner={isTrickWinner} />
        </div>

        {/* Name */}
        <span className="font-bold text-[10px] sm:text-xs text-slate-100 truncate block max-w-[68px] sm:max-w-[78px] mx-auto mt-0.5">
          {displayName.split(' ')[0]}
        </span>

        {/* Status / Card Count */}
        <div className="text-[9px] sm:text-[10px] text-emerald-200/90 mt-0.5 leading-tight flex flex-col items-center gap-0.5">
          {renderStatusBadge()}
          {phase === 'play' && (
            <span className="text-[8px] text-amber-300/80">
              {teamTricks}ل
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
