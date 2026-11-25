import React from 'react';
import { PlayerId } from '../types/game';

interface AvatarCharacterProps {
  id: PlayerId;
  size?: 'sm' | 'md' | 'lg';
  isTurn?: boolean;
  isWinner?: boolean;
  className?: string;
}

export const AvatarCharacter: React.FC<AvatarCharacterProps> = ({
  id,
  size = 'md',
  isTurn = false,
  isWinner = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-13 h-13 sm:w-15 sm:h-15',
  }[size];

  // Specific visual styling for each of the 4 authentic Omani players
  const renderSVGAvatar = () => {
    switch (id) {
      // Player 0: أنت (You) — Omani young man with finely embroidered Omani Kummah (الكمة العمانية)
      case 0:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
            {/* Background gradient */}
            <circle cx="50" cy="50" r="48" fill="url(#grad0)" />
            {/* Dishdasha body */}
            <path d="M22 96 C24 72 35 68 50 68 C65 68 76 72 78 96 Z" fill="#F8FAFC" />
            {/* Dishdasha collar & tassel (الكركوشة) */}
            <path d="M47 68 L53 68 L51 84 L49 84 Z" fill="#E2E8F0" />
            <path d="M51 72 C55 74 57 78 56 82" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" />
            {/* Neck */}
            <rect x="42" y="58" width="16" height="14" rx="3" fill="#D49A73" />
            {/* Head */}
            <ellipse cx="50" cy="46" rx="20" ry="22" fill="#E5AA82" />
            {/* Ears */}
            <circle cx="29" cy="48" r="5" fill="#D49A73" />
            <circle cx="71" cy="48" r="5" fill="#D49A73" />
            {/* Eyes */}
            <ellipse cx="43" cy="45" rx="2.8" ry="3.2" fill="#1E293B" />
            <ellipse cx="57" cy="45" rx="2.8" ry="3.2" fill="#1E293B" />
            <circle cx="44" cy="44" r="1" fill="#FFFFFF" />
            <circle cx="58" cy="44" r="1" fill="#FFFFFF" />
            {/* Eyebrows */}
            <path d="M39 39 Q44 37 48 40" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M52 40 Q56 37 61 39" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Nose */}
            <path d="M50 43 L48 51 L52 51" stroke="#BD7B55" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Mustache & Beard */}
            <path d="M42 55 Q50 58 58 55" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M40 58 C45 66 55 66 60 58" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Omani Kummah (الكمة العمانية) with geometric embroidery */}
            <path d="M28 36 C28 20 37 16 50 16 C63 16 72 20 72 36 Z" fill="#F1F5F9" />
            <path d="M28 36 L72 36 L71 39 L29 39 Z" fill="#0D9488" />
            {/* Kummah embroidery patterns */}
            <path d="M34 26 L38 32 L42 26 L46 32 L50 26 L54 32 L58 26 L62 32 L66 26" stroke="#D97706" strokeWidth="1.6" fill="none" />
            <circle cx="42" cy="22" r="1.5" fill="#0D9488" />
            <circle cx="50" cy="20" r="1.5" fill="#D97706" />
            <circle cx="58" cy="22" r="1.5" fill="#0D9488" />
            <defs>
              <linearGradient id="grad0" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#064E3B" />
                <stop offset="100%" stopColor="#022C22" />
              </linearGradient>
            </defs>
          </svg>
        );

      // Player 1: المنافس ١ (Opponent 1 - Right) — Veteran player with burgundy/crimson Kashmiri Massar (مصر كشميري)
      case 1:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
            <circle cx="50" cy="50" r="48" fill="url(#grad1)" />
            {/* Dishdasha */}
            <path d="M22 96 C24 72 35 68 50 68 C65 68 76 72 78 96 Z" fill="#F1F5F9" />
            <rect x="42" y="58" width="16" height="14" rx="3" fill="#C68962" />
            {/* Head */}
            <ellipse cx="50" cy="47" rx="20" ry="22" fill="#DB9971" />
            <circle cx="28" cy="49" r="4.5" fill="#C68962" />
            <circle cx="72" cy="49" r="4.5" fill="#C68962" />
            {/* Eyes - focused & sharp */}
            <ellipse cx="42" cy="45" rx="3" ry="2.6" fill="#0F172A" />
            <ellipse cx="58" cy="45" rx="3" ry="2.6" fill="#0F172A" />
            <circle cx="43" cy="44" r="0.8" fill="#FFF" />
            <circle cx="59" cy="44" r="0.8" fill="#FFF" />
            {/* Eyebrows */}
            <path d="M37 39 Q43 35 47 40" stroke="#334155" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <path d="M53 40 Q57 35 63 39" stroke="#334155" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            {/* Nose */}
            <path d="M50 43 L48 51 L53 51" stroke="#A96541" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            {/* Mustache - seasoned & prominent */}
            <path d="M39 56 Q50 54 61 56" stroke="#1E293B" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M46 60 Q50 63 54 60" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
            {/* Traditional Omani Massar Turban (المصر العماني - نقش كشميري أحمر/عنابي) */}
            <path d="M26 36 C25 15 38 12 50 12 C62 12 75 15 74 36 Z" fill="#881337" />
            <path d="M24 33 C32 26 44 24 50 25 C58 26 68 28 76 34 C72 38 60 41 50 40 C38 41 27 38 24 33 Z" fill="#9F1239" />
            {/* Massar fold wraps */}
            <path d="M26 32 Q50 36 74 32" stroke="#FDE047" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
            <path d="M28 26 Q50 30 72 26" stroke="#FDA4AF" strokeWidth="1.2" fill="none" />
            <path d="M32 20 Q50 24 68 20" stroke="#FDE047" strokeWidth="1.2" fill="none" />
            <defs>
              <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#450A0A" />
                <stop offset="100%" stopColor="#1E0707" />
              </linearGradient>
            </defs>
          </svg>
        );

      // Player 2: الشريك (Partner - Top) — Loyal companion with gold embroidered Kummah and friendly smile
      case 2:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
            <circle cx="50" cy="50" r="48" fill="url(#grad2)" />
            {/* Dishdasha */}
            <path d="M22 96 C24 72 35 68 50 68 C65 68 76 72 78 96 Z" fill="#FFFFFF" />
            <rect x="42" y="58" width="16" height="14" rx="3" fill="#DFA079" />
            {/* Head */}
            <ellipse cx="50" cy="46" rx="20" ry="22" fill="#EBB490" />
            <circle cx="29" cy="48" r="4.8" fill="#DFA079" />
            <circle cx="71" cy="48" r="4.8" fill="#DFA079" />
            {/* Warm Eyes with gentle smile */}
            <path d="M40 46 Q44 42 48 46" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M52 46 Q56 42 60 46" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <circle cx="44" cy="47" r="1.8" fill="#1E293B" />
            <circle cx="56" cy="47" r="1.8" fill="#1E293B" />
            {/* Eyebrows */}
            <path d="M38 39 Q43 37 47 40" stroke="#334155" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M53 40 Q57 37 62 39" stroke="#334155" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Nose */}
            <path d="M50 43 L48 50 L52 50" stroke="#C5855E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Warm friendly smile */}
            <path d="M43 56 Q50 62 57 56" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M42 55 Q50 56 58 55" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
            {/* Elegant Omani Kummah in Gold & Off-white */}
            <path d="M28 35 C28 20 37 15 50 15 C63 15 72 20 72 35 Z" fill="#F8FAFC" />
            <path d="M28 35 L72 35 L71 38 L29 38 Z" fill="#D97706" />
            {/* Golden embroidery */}
            <circle cx="50" cy="24" r="3.5" fill="#F59E0B" />
            <path d="M35 27 Q50 20 65 27" stroke="#D97706" strokeWidth="1.5" fill="none" />
            <path d="M33 32 Q50 26 67 32" stroke="#F59E0B" strokeWidth="1.4" fill="none" />
            <defs>
              <linearGradient id="grad2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#047857" />
                <stop offset="100%" stopColor="#064E3B" />
              </linearGradient>
            </defs>
          </svg>
        );

      // Player 3: المنافس ٢ (Opponent 2 - Left) — Calm strategist with dark indigo Massar
      case 3:
      default:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
            <circle cx="50" cy="50" r="48" fill="url(#grad3)" />
            {/* Dishdasha */}
            <path d="M22 96 C24 72 35 68 50 68 C65 68 76 72 78 96 Z" fill="#F1F5F9" />
            <rect x="42" y="58" width="16" height="14" rx="3" fill="#CA8A65" />
            {/* Head */}
            <ellipse cx="50" cy="47" rx="20" ry="22" fill="#E29F79" />
            <circle cx="28" cy="49" r="4.5" fill="#CA8A65" />
            <circle cx="72" cy="49" r="4.5" fill="#CA8A65" />
            {/* Eyes - shrewd & analytical */}
            <ellipse cx="43" cy="45" rx="2.8" ry="2.8" fill="#0F172A" />
            <ellipse cx="57" cy="45" rx="2.8" ry="2.8" fill="#0F172A" />
            <circle cx="44" cy="44" r="0.8" fill="#FFF" />
            <circle cx="58" cy="44" r="0.8" fill="#FFF" />
            {/* Eyebrows - one slightly raised */}
            <path d="M38 41 Q43 38 47 41" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M53 39 Q57 34 62 38" stroke="#1E293B" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            {/* Nose */}
            <path d="M50 43 L48 51 L53 51" stroke="#A96541" strokeWidth="1.7" strokeLinecap="round" fill="none" />
            {/* Mustache & Chin beard */}
            <path d="M42 56 Q50 54 58 56" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="50" cy="62" r="2" fill="#1E293B" />
            {/* Dark Indigo / Emerald Omani Massar Turban */}
            <path d="M26 36 C25 15 38 12 50 12 C62 12 75 15 74 36 Z" fill="#1E1B4B" />
            <path d="M24 33 C32 26 44 24 50 25 C58 26 68 28 76 34 C72 38 60 41 50 40 C38 41 27 38 24 33 Z" fill="#312E81" />
            <path d="M26 32 Q50 36 74 32" stroke="#60A5FA" strokeWidth="1.2" strokeDasharray="3 2" fill="none" />
            <path d="M29 25 Q50 30 71 25" stroke="#CBD5E1" strokeWidth="1.2" fill="none" />
            <defs>
              <linearGradient id="grad3" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1E1B4B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>
            </defs>
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative rounded-full p-0.5 transition-all duration-300 shadow-md ${sizeClasses} ${
        isWinner
          ? 'ring-3 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.9)] scale-110'
          : isTurn
          ? 'ring-2 ring-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
          : 'ring-1 ring-emerald-600/40'
      } ${className}`}
    >
      {renderSVGAvatar()}
    </div>
  );
};
