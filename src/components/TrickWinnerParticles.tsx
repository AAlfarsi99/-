import React, { useEffect, useRef } from 'react';
import { PlayerId } from '../types/game';

interface TrickWinnerParticlesProps {
  winner: PlayerId | null;
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
  shape: 'star' | 'circle' | 'spark';
}

export const TrickWinnerParticles: React.FC<TrickWinnerParticlesProps> = ({ winner }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (winner === null) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Position relative to winning player's seat
    const seatElem = document.getElementById(`seat-${winner}`);
    const seatRect = seatElem ? seatElem.getBoundingClientRect() : null;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const originX = seatRect ? seatRect.left + seatRect.width / 2 : window.innerWidth / 2;
    const originY = seatRect ? seatRect.top + seatRect.height / 2 : window.innerHeight / 2;

    const colors = ['#fbbf24', '#f59e0b', '#fde047', '#ffffff', '#ffd700', '#f43f5e'];
    const particles: Particle[] = [];
    const count = 42;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 5.5;
      const shapes: ('star' | 'circle' | 'spark')[] = ['star', 'circle', 'spark'];

      particles.push({
        x: originX + (Math.random() - 0.5) * 30,
        y: originY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.2, // slight upward burst
        size: 3 + Math.random() * 7,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
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
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gentle gravity
        p.vx *= 0.98;
        p.alpha -= p.decay;
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;

        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.shape === 'star') {
          drawStar(0, 0, 4, p.size, p.size * 0.4);
        } else if (p.shape === 'spark') {
          // 4-point diamond glint
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.5);
          ctx.lineTo(p.size * 0.4, 0);
          ctx.lineTo(0, p.size * 1.5);
          ctx.lineTo(-p.size * 0.4, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
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

    return () => {
      cancelAnimationFrame(animId);
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [winner]);

  if (winner === null) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
