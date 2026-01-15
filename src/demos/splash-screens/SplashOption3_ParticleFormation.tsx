/**
 * OPTION 3: Particle Formation Splash Screen - OPTIMIZED FOR SMOOTH ANIMATIONS
 *
 * GPU-accelerated canvas with optimized particle rendering
 */

import React, { useEffect, useRef, useState } from 'react';

const SplashOption3_ParticleFormation: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Set canvas size
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Limit DPR for performance
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.scale(dpr, dpr);

    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    // Load logo and extract pixels
    const logo = new Image();
    logo.src = '/sm-logo.png';

    interface Particle {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      originX: number;
      originY: number;
      vx: number;
      vy: number;
      size: number;
      r: number;
      g: number;
      b: number;
      alpha: number;
      isLogo: boolean;
    }

    const particles: Particle[] = [];
    let animationId: number;
    let frame = 0;
    let logoParticlesReady = false;
    let lastTime = 0;

    logo.onload = () => {
      const offscreen = document.createElement('canvas');
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      const logoSize = 320;
      offscreen.width = logoSize;
      offscreen.height = logoSize;
      offCtx.drawImage(logo, 0, 0, logoSize, logoSize);

      const imageData = offCtx.getImageData(0, 0, logoSize, logoSize);
      const pixels = imageData.data;

      // Sample pixels - increased step for better performance
      const step = 4;
      for (let y = 0; y < logoSize; y += step) {
        for (let x = 0; x < logoSize; x += step) {
          const i = (y * logoSize + x) * 4;
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          if (a > 100) {
            const targetX = centerX - logoSize / 2 + x;
            const targetY = centerY - logoSize / 2 + y - 50;

            particles.push({
              x: Math.random() * width,
              y: Math.random() * height,
              targetX,
              targetY,
              originX: Math.random() * width,
              originY: Math.random() * height,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              size: 2 + Math.random() * 2,
              r, g, b,
              alpha: 1,
              isLogo: true,
            });
          }
        }
      }

      // Reduced ambient particles
      for (let i = 0; i < 150; i++) {
        const colors = [
          { r: 0, g: 136, b: 255 },
          { r: 0, g: 255, b: 255 },
          { r: 68, g: 136, b: 255 },
          { r: 0, g: 170, b: 255 },
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          targetX: Math.random() * width,
          targetY: Math.random() * height,
          originX: Math.random() * width,
          originY: Math.random() * height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: 1 + Math.random() * 2,
          ...color,
          alpha: 0.3 + Math.random() * 0.4,
          isLogo: false,
        });
      }

      logoParticlesReady = true;
    };

    const animate = (currentTime: number) => {
      // Target 60fps
      const deltaTime = currentTime - lastTime;
      if (deltaTime < 16) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      lastTime = currentTime;

      // Clear with solid color (faster than semi-transparent)
      ctx.fillStyle = '#020510';
      ctx.fillRect(0, 0, width, height);

      const formationStart = 60;
      const formationEnd = 180;

      // Batch similar operations
      ctx.globalAlpha = 1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (p.isLogo && logoParticlesReady) {
          if (frame < formationStart) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > width) p.vx *= -0.9;
            if (p.y < 0 || p.y > height) p.vy *= -0.9;
          } else {
            const progress = Math.min((frame - formationStart) / (formationEnd - formationStart), 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            p.x = p.originX + (p.targetX - p.originX) * easeProgress;
            p.y = p.originY + (p.targetY - p.originY) * easeProgress;
            if (frame === formationStart) {
              p.originX = p.x;
              p.originY = p.y;
            }
          }
        } else {
          // Simplified ambient particle movement
          p.x += Math.sin(frame * 0.01 + p.originX * 0.01) * 0.5;
          p.y += Math.cos(frame * 0.01 + p.originY * 0.01) * 0.5;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }

        // Draw particle - simplified for performance
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = `rgb(${p.r}, ${p.g}, ${p.b})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      frame++;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    // Phase transitions
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 4200),
      setTimeout(() => onComplete?.(), 5500),
    ];

    return () => {
      cancelAnimationFrame(animationId);
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#020510] overflow-hidden">
      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Text Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 pointer-events-none">
        <h1
          className={`text-6xl font-black tracking-wider transition-all duration-1000 gpu-layer ${
            phase >= 3 ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #00d4ff 50%, #0066ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            transform: phase >= 3 ? 'translateY(0) translateZ(0)' : 'translateY(10px) translateZ(0)',
          }}
        >
          SCAN-MASTER
        </h1>

        <div
          className={`mt-6 flex items-center gap-6 transition-opacity duration-700 ${
            phase >= 3 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-cyan-400" />
          <p className="text-cyan-300/80 tracking-[0.4em] text-sm uppercase">
            Precision NDT Technology
          </p>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-cyan-400" />
        </div>

        {/* Status indicators */}
        <div
          className={`mt-10 flex items-center gap-8 transition-opacity duration-700 ${
            phase >= 4 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {['AMS-STD-2154', 'ASTM E2375', 'EN 12668'].map((std, i) => (
            <div key={std} className="flex items-center gap-2">
              <div
                className="w-2 h-2 bg-green-400 rounded-full gpu-layer"
                style={{
                  animation: `pulse-dot 1s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
              <span className="text-cyan-400/70 text-xs font-mono">{std}</span>
            </div>
          ))}
        </div>

        {/* Loading wave */}
        <div
          className={`mt-8 flex items-center gap-1 transition-opacity duration-500 ${
            phase >= 4 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-cyan-400 rounded-full gpu-layer"
              style={{
                height: '20px',
                animation: `wave-bar 1s ease-in-out ${i * 0.05}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* HUD Corners */}
      <div className={`absolute top-8 left-8 transition-opacity duration-500 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        <svg width="100" height="100" className="text-cyan-500/40">
          <path d="M0 40 L0 0 L40 0" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="5" cy="5" r="3" fill="currentColor" className="animate-pulse" />
        </svg>
        <div className="mt-2 text-xs font-mono text-cyan-500/60">
          <div>PARTICLES: ACTIVE</div>
          <div>FORMATION: READY</div>
        </div>
      </div>

      <div className={`absolute top-8 right-8 text-right transition-opacity duration-500 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        <svg width="100" height="100" className="text-cyan-500/40 ml-auto">
          <path d="M100 40 L100 0 L60 0" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="95" cy="5" r="3" fill="currentColor" className="animate-pulse" />
        </svg>
        <div className="mt-2 text-xs font-mono text-cyan-500/60">
          <div>SYNC: 100%</div>
          <div>RENDER: GPU</div>
        </div>
      </div>

      <div className={`absolute bottom-8 left-8 transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <svg width="100" height="100" className="text-cyan-500/40">
          <path d="M0 60 L0 100 L40 100" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      <div className={`absolute bottom-8 right-8 transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <svg width="100" height="100" className="text-cyan-500/40 ml-auto">
          <path d="M100 60 L100 100 L60 100" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      <style>{`
        .gpu-layer {
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 0.5; transform: scale(1) translateZ(0); }
          50% { opacity: 1; transform: scale(1.3) translateZ(0); }
        }

        @keyframes wave-bar {
          0%, 100% { height: 5px; opacity: 0.3; }
          50% { height: 20px; opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SplashOption3_ParticleFormation;
