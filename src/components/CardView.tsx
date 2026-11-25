import React from 'react';
import { Card } from '../types/game';
import { CardBackStyle } from '../types/settings';
import { formatRank, isRed } from '../utils/gameLogic';

interface CardViewProps {
  card?: Card;
  faceDown?: boolean;
  cardBackStyle?: CardBackStyle;
  disabled?: boolean;
  selected?: boolean;
  isPlayable?: boolean;
  isWinningCard?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  faceDown = false,
  cardBackStyle = 'omani-khanjar',
  disabled = false,
  selected = false,
  isPlayable = false,
  isWinningCard = false,
  size = 'md',
  onClick,
  className = '',
  style,
}) => {
  // Dimension presets
  const sizeClasses = {
    xs: 'w-10 h-15 sm:w-11 sm:h-16 text-xs rounded-lg p-1',
    sm: 'w-11 h-16 sm:w-12 sm:h-17 md:w-13 md:h-18 text-xs rounded-md',
    md: 'w-14 h-20 sm:w-16 sm:h-24 md:w-18 md:h-26 text-sm rounded-lg',
    lg: 'w-18 h-26 sm:w-20 sm:h-30 md:w-24 md:h-34 text-base rounded-xl',
  }[size];

  // Render stylized card backs based on selected theme
  if (faceDown || !card) {
    if (cardBackStyle === 'royal-blue') {
      return (
        <div
          style={style}
          className={`relative ${sizeClasses} select-none shrink-0 transition-transform duration-200 shadow-xl border-2 border-amber-300/60 bg-gradient-to-br from-[#163661] via-[#0d2240] to-[#061224] p-1 flex items-center justify-center overflow-hidden ${className}`}
        >
          {/* Royal Blue Arabesque Pattern */}
          <div className="w-full h-full border border-sky-400/40 rounded-[inherit] flex items-center justify-center relative bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px] opacity-90 overflow-hidden">
            {/* Corner Ornamental Accents */}
            <div className="absolute top-0.5 right-0.5 w-2 h-2 border-t border-r border-amber-300/80 pointer-events-none" />
            <div className="absolute bottom-0.5 left-0.5 w-2 h-2 border-b border-l border-amber-300/80 pointer-events-none" />
            
            {/* Center Sapphire 8-Point Star Medallion */}
            <div className="w-7 h-9 sm:w-9 sm:h-11 border-2 border-amber-300 rounded-full flex flex-col items-center justify-center bg-[#071933] shadow-[0_0_10px_rgba(56,189,248,0.5)]">
              <span className="text-amber-300 text-[11px] sm:text-xs">✦</span>
              <span className="text-amber-400 text-[9px] sm:text-[10px] font-black -mt-1 font-serif">ملك</span>
              <span className="text-amber-300 text-[11px] sm:text-xs -mt-1">✦</span>
            </div>
          </div>
        </div>
      );
    }

    if (cardBackStyle === 'crimson-damask') {
      return (
        <div
          style={style}
          className={`relative ${sizeClasses} select-none shrink-0 transition-transform duration-200 shadow-xl border-2 border-amber-400/70 bg-gradient-to-br from-[#6b1424] via-[#480c17] to-[#25040b] p-1 flex items-center justify-center overflow-hidden ${className}`}
        >
          {/* Crimson Damask Pattern */}
          <div className="w-full h-full border border-rose-300/35 rounded-[inherit] flex items-center justify-center relative bg-[radial-gradient(#fb7185_1px,transparent_1px)] [background-size:6px_6px] opacity-90 overflow-hidden">
            <div className="absolute inset-1 border border-amber-400/30 rounded-[inherit] pointer-events-none" />
            
            {/* Center Imperial Crest */}
            <div className="w-7 h-9 sm:w-9 sm:h-11 border-2 border-amber-400 rounded-lg rotate-45 flex items-center justify-center bg-[#29050e] shadow-[0_0_10px_rgba(251,113,133,0.5)]">
              <span className="-rotate-45 text-amber-300 text-xs sm:text-sm font-serif font-black">👑</span>
            </div>
          </div>
        </div>
      );
    }

    if (cardBackStyle === 'emerald-luxury') {
      return (
        <div
          style={style}
          className={`relative ${sizeClasses} select-none shrink-0 transition-transform duration-200 shadow-xl border-2 border-emerald-400/70 bg-gradient-to-br from-[#0f4d38] via-[#093224] to-[#041a12] p-1 flex items-center justify-center overflow-hidden ${className}`}
        >
          {/* Luxury Emerald Weave */}
          <div className="w-full h-full border border-amber-300/40 rounded-[inherit] flex items-center justify-center relative bg-[radial-gradient(#34d399_1.2px,transparent_1.2px)] [background-size:7px_7px] opacity-90 overflow-hidden">
            <div className="absolute inset-1 border border-emerald-400/25 rounded-md pointer-events-none" />
            
            {/* Center Golden Compass Seal */}
            <div className="w-7 h-9 sm:w-9 sm:h-11 border-2 border-amber-400 rounded-full flex flex-col items-center justify-center bg-[#031c13] shadow-[0_0_10px_rgba(52,211,153,0.4)]">
              <span className="text-amber-400 text-xs sm:text-sm">۞</span>
              <span className="text-emerald-300 text-[8px] font-bold font-sans">عُمان</span>
            </div>
          </div>
        </div>
      );
    }

    // Default: 'omani-khanjar' (الخنجر العُماني والتطريز الذهبي)
    return (
      <div
        style={style}
        className={`relative ${sizeClasses} select-none shrink-0 transition-transform duration-200 shadow-lg border-2 border-[#d4af37]/70 bg-gradient-to-br from-[#1b3d32] via-[#0f2720] to-[#081713] p-1 flex items-center justify-center overflow-hidden ${className}`}
      >
        {/* Ornate back pattern */}
        <div className="w-full h-full border border-[#d4af37]/45 rounded-[inherit] flex items-center justify-center relative bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:6px_6px] opacity-90 overflow-hidden">
          <div className="absolute inset-0.5 border border-[#d4af37]/20 rounded-md pointer-events-none" />
          <div className="w-6 h-8 sm:w-8 sm:h-10 border-2 border-[#d4af37] rounded-full flex items-center justify-center bg-[#071713]/95 shadow-[0_0_10px_rgba(212,175,55,0.5)]">
            <span className="text-[#d4af37] text-xs font-serif font-bold">🇴🇲</span>
          </div>
        </div>
      </div>
    );
  }

  // Hearts (♥), Diamonds (♦), and Red Joker (🃏R) MUST be bright red
  const red = isRed(card.s);
  const rankText = card.j ? (card.j === 'B' ? 'جوكر أسود' : 'جوكر أحمر') : formatRank(card.r, card.j);
  const suitChar = card.j ? '🃏' : card.s;
  const suitColor = red ? 'text-[#e11d48]' : 'text-[#0a0f1d]'; // Vivid crimson red for Hearts & Diamonds, deep black for Spades & Clubs

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={`relative ${sizeClasses} select-none shrink-0 transition-all duration-200 cursor-pointer text-right flex flex-col justify-between ${
        size === 'xs' || size === 'sm' ? 'p-1 sm:p-1.5' : 'p-1.5 sm:p-2'
      } 
        bg-gradient-to-b from-white via-white to-[#fbfbfa] border-2 border-slate-200/90 shadow-[0_4px_14px_rgba(0,0,0,0.32)]
        ${suitColor}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}
        ${
          isPlayable && !disabled
            ? 'ring-2 ring-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.7)] hover:-translate-y-2 hover:shadow-[0_0_24px_rgba(251,191,36,0.9)] hover:border-amber-300'
            : ''
        }
        ${
          selected
            ? '-translate-y-3.5 ring-2 ring-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.95)] animate-card-glow'
            : ''
        }
        ${
          isWinningCard
            ? 'ring-3 ring-amber-400 scale-105 shadow-[0_0_25px_rgba(251,191,36,0.95),0_0_50px_rgba(245,158,11,0.6)]'
            : ''
        }
        ${className}
      `}
    >
      {/* Top corner pip */}
      <div className={`flex flex-col items-center leading-none self-start ${suitColor}`}>
        <span className={`font-black tracking-tighter ${size === 'xs' ? 'text-[11px]' : 'text-xs sm:text-sm'}`}>
          {card.j ? '🃏' : rankText}
        </span>
        <span
          className={`-mt-0.5 ${size === 'xs' ? 'text-[10px]' : 'text-xs sm:text-sm'} ${
            card.j ? (card.j === 'R' ? 'text-[#e11d48] font-black' : 'text-slate-900 font-black') : (red ? 'text-[#e11d48]' : 'text-[#0f172a]')
          }`}
        >
          {card.j ? (card.j === 'R' ? 'حم' : 'سود') : suitChar}
        </span>
      </div>

      {/* Center artwork */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-0.5">
        {card.j ? (
          <div className="text-center">
            <span className={`${size === 'xs' ? 'text-xl' : 'text-2xl sm:text-3xl'} leading-none block drop-shadow-sm`}>
              🃏
            </span>
            <span
              className={`font-black block mt-0.5 rounded shadow-sm border ${
                size === 'xs' ? 'text-[8px] px-1 py-0' : 'text-[9px] sm:text-[10px] px-1.5 py-0.2'
              } ${
                card.j === 'R'
                  ? 'text-white bg-[#e11d48] border-red-300'
                  : 'text-white bg-slate-800 border-slate-600'
              }`}
            >
              {card.j === 'B' ? 'أسود' : 'أحمر'}
            </span>
          </div>
        ) : (
          <span
            className={`${
              size === 'xs' ? 'text-2xl' : 'text-2xl sm:text-3xl md:text-4xl'
            } font-serif drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)] select-none ${
              red ? 'text-[#e11d48]' : 'text-[#0f172a]'
            }`}
          >
            {suitChar}
          </span>
        )}
      </div>

      {/* Bottom corner pip (inverted) */}
      <div className={`flex flex-col items-center leading-none self-end rotate-180 ${suitColor}`}>
        <span className={`font-extrabold tracking-tighter ${size === 'xs' ? 'text-[11px]' : 'text-xs sm:text-sm'}`}>
          {card.j ? '🃏' : rankText}
        </span>
        <span
          className={`-mt-0.5 ${size === 'xs' ? 'text-[10px]' : 'text-xs sm:text-sm'} ${
            card.j ? (card.j === 'R' ? 'text-[#e11d48] font-black' : 'text-slate-900 font-black') : (red ? 'text-[#e11d48]' : 'text-[#0f172a]')
          }`}
        >
          {card.j ? (card.j === 'R' ? 'حم' : 'سود') : suitChar}
        </span>
      </div>

      {/* Luminous sheen border */}
      <div className="absolute inset-0 rounded-[inherit] border border-white/70 pointer-events-none" />
      {/* Subtle selection radial overlay */}
      {(selected || isWinningCard) && (
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-t from-amber-400/15 via-transparent to-white/20 pointer-events-none" />
      )}
    </button>
  );
};
