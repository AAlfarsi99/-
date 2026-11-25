import React, { useEffect, useRef, useState } from 'react';
import { PlayerId } from '../types/game';
import { Flame, Zap, Sparkles, Skull } from 'lucide-react';

export interface JokerEffectData {
  id: string;
  jokerType: 'R' | 'B';
  player: PlayerId;
  playerName: string;
  originX?: number;
  originY?: number;
}

interface JokerParticlesProps {
  effect: JokerEffectData | null;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  shape: 'star' | 'circle' | 'spark' | 'ember' | 'ring';
  scale?: number;
  maxRadius?: number;
  currentRadius?: number;
}

export const JokerParticles: React.FC<JokerParticlesProps> = ({ effect, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [currentEffect, setCurrentEffect] = useState<JokerEffectData | null>(null);

  useEffect(() => {
    if (!effect) {
      setShowBanner(false);
      setCurrentEffect(null);
      return;
    }

    setCurrentEffect(effect);
    setShowBanner(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Determine burst origin: slot or center
    let originX = effect.originX;
    let originY = effect.originY;

    if (originX === undefined || originY === undefined) {
      const slotElem = document.getElementById(`played-slot-${effect.player}`);
      if (slotElem) {
        const rect = slotElem.getBoundingClientRect();
        originX = rect.left + rect.width / 2;
        originY = rect.top + rect.height / 2;
      } else {
        originX = window.innerWidth / 2;
        originY = window.innerHeight / 2;
      }
    }

    const isRed = effect.jokerType === 'R';

    // Rich distinct color palettes
    const redPalette = [
      '#ef4444', // Red-500
      '#dc2626', // Red-600
      '#f97316', // Orange-500
      '#fbbf24', // Amber-400
      '#ffd700', // Gold
      '#ffffff', // Pure white
      '#f43f5e', // Rose-500
    ];

    const blackPalette = [
      '#8b5cf6', // Violet-500
      '#a855f7', // Purple-500
      '#06b6d4', // Cyan-500
      '#38bdf8', // Sky-400
      '#c084fc', // Purple-400
      '#e0e7ff', // Pale electric indigo
      '#ffffff', // Pure white
    ];

    const palette = isRed ? redPalette : blackPalette;
    const particles: Particle[] = [];

    // 1. Shockwave rings (Fast subtle blast wave)
    for (let r = 0; r < 2; r++) {
      particles.push({
        x: originX,
        y: originY,
        vx: 0,
        vy: 0,
        size: 2 + r * 1.5,
        alpha: 0.85,
        decay: 0.048,
        color: palette[r % palette.length],
        rotation: 0,
        rotSpeed: 0,
        shape: 'ring',
        currentRadius: 10 + r * 10,
        maxRadius: 110 + r * 25,
      });
    }

    // 2. High-energy burst sparks & embers (faster decay so view isn't blocked)
    const particleCount = isRed ? 36 : 40;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4.0 + Math.random() * 7.0;
      const shapes: ('star' | 'circle' | 'spark' | 'ember')[] = ['star', 'circle', 'spark', 'ember'];

      particles.push({
        x: originX + (Math.random() - 0.5) * 12,
        y: originY + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (isRed ? 1.5 : 0.8),
        size: 2.5 + Math.random() * 4.5,
        alpha: 1,
        decay: 0.042 + Math.random() * 0.035,
        color: palette[Math.floor(Math.random() * palette.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.4,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    let animId: number;

    const drawStar = (cx: number, cy: number, spikes: number, outerR: number, innerR: number) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerR;
        y = cy + Math.sin(rot) * outerR;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerR;
        y = cy + Math.sin(rot) * innerR;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerR);
      ctx.closePath();
      ctx.fill();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let activeCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.alpha <= 0) continue;

        activeCount++;

        // Render shockwave ring
        if (p.shape === 'ring') {
          if (p.currentRadius !== undefined && p.maxRadius !== undefined) {
            p.currentRadius += (p.maxRadius - p.currentRadius) * 0.16 + 2.5;
            p.alpha -= p.decay;

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = Math.max(1, p.size * (p.alpha));
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.currentRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
          continue;
        }

        // Standard particle physics
        p.x += p.vx;
        p.y += p.vy;

        if (isRed) {
          p.vy -= 0.05;
        } else {
          p.vy += 0.04;
        }

        p.vx *= 0.94;
        p.vy *= 0.94;
        p.alpha -= p.decay;
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = isRed ? 10 : 8;

        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.shape === 'star') {
          drawStar(0, 0, 4, p.size * 1.1, p.size * 0.35);
        } else if (p.shape === 'spark') {
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.8);
          ctx.lineTo(p.size * 0.35, 0);
          ctx.lineTo(0, p.size * 1.8);
          ctx.lineTo(-p.size * 0.35, 0);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'ember') {
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.5, p.color);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      if (activeCount > 0) {
        animId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animId = requestAnimationFrame(render);

    // Fast auto dismiss (750ms) so game view is never obstructed
    const timer = setTimeout(() => {
      setShowBanner(false);
      if (onComplete) onComplete();
    }, 750);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(timer);
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [effect, onComplete]);

  if (!effect && !showBanner) return null;

  const isRed = currentEffect?.jokerType === 'R';

  return (
    <div
      onClick={() => {
        setShowBanner(false);
        if (onComplete) onComplete();
      }}
      className="fixed inset-0 pointer-events-auto z-40 cursor-pointer"
      title="انقر للمتابعة السريعة"
    >
      {/* 1. Brief Subtle Ambient Vignette (Transparent edge glow only, no dark mask) */}
      <div
        className={`fixed inset-0 pointer-events-none z-40 transition-opacity duration-300 ${
          showBanner ? 'opacity-40' : 'opacity-0'
        }`}
        style={{
          background: isRed
            ? 'radial-gradient(circle at 50% 50%, transparent 60%, rgba(239, 68, 68, 0.25) 100%)'
            : 'radial-gradient(circle at 50% 50%, transparent 60%, rgba(139, 92, 246, 0.25) 100%)',
        }}
      />

      {/* 2. Fullscreen Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50"
        style={{ width: '100vw', height: '100vh' }}
      />

      {/* 3. Non-Intrusive Slim Header Pill (Kept at Very Top Edge to Not Block Table or Cards) */}
      {showBanner && currentEffect && (
        <div className="fixed top-2 sm:top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border shadow-xl backdrop-blur-md flex items-center gap-2 ${
              isRed
                ? 'bg-red-950/90 border-red-500/80 text-amber-200'
                : 'bg-purple-950/90 border-purple-500/80 text-cyan-200'
            }`}
          >
            <span className="text-sm sm:text-base leading-none">🃏</span>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black">
              <span className={isRed ? 'text-amber-300' : 'text-cyan-300'}>
                {isRed ? 'الجوكر الأحمر' : 'الجوكر الأسود'}
              </span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-white text-[11px] sm:text-xs font-bold">
                {currentEffect.playerName}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
