/**
 * OPTION 4: Tech Matrix / Cyberpunk Splash Screen - OPTIMIZED FOR SMOOTH ANIMATIONS
 *
 * GPU-accelerated matrix rain and glitch effects
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';

const SplashOption4_TechMatrix: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [glitchText, setGlitchText] = useState('SCAN-MASTER');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 2600),
      setTimeout(() => setPhase(5), 3400),
      setTimeout(() => onComplete?.(), 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Optimized Matrix rain effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = 'SCANMASTER01NDT検査超音波ULTRASONIC';
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = new Array(columns).fill(1);
    const speeds: number[] = new Array(columns).fill(0).map(() => 0.5 + Math.random() * 0.5);

    let lastTime = 0;
    let animationId: number;

    const draw = (currentTime: number) => {
      // Throttle to ~24fps for matrix effect (looks better with slight motion blur)
      if (currentTime - lastTime < 42) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      lastTime = currentTime;

      ctx.fillStyle = 'rgba(0, 5, 15, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Simplified color (no gradient for performance)
        const brightness = Math.max(0, 1 - (y / canvas.height) * 0.5);
        ctx.fillStyle = `rgba(0, ${Math.floor(200 * brightness)}, ${Math.floor(255 * brightness)}, ${brightness})`;
        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        drops[i] += speeds[i];
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Optimized glitch text effect - reduced frequency
  useEffect(() => {
    if (phase < 3) return;

    const originalText = 'SCAN-MASTER';
    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';

    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.95) { // Reduced frequency
        let glitched = '';
        for (let i = 0; i < originalText.length; i++) {
          if (Math.random() > 0.9) {
            glitched += glitchChars[Math.floor(Math.random() * glitchChars.length)];
          } else {
            glitched += originalText[i];
          }
        }
        setGlitchText(glitched);
        setTimeout(() => setGlitchText(originalText), 50);
      }
    }, 150); // Increased interval

    return () => clearInterval(glitchInterval);
  }, [phase]);

  // Memoize data streams
  const leftStream = useMemo(() =>
    [...Array(40)].map((_, i) => `> 0x${Math.random().toString(16).substring(2, 10).toUpperCase()}`),
  []);

  const rightStream = useMemo(() =>
    [...Array(40)].map((_, i) => Math.random().toString(36).substring(2, 12).toUpperCase()),
  []);

  return (
    <div className="fixed inset-0 bg-[#000510] overflow-hidden">
      {/* Matrix Rain Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-40" />

      {/* Scan Lines Overlay - simplified */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 255, 0.1) 2px,
            rgba(0, 255, 255, 0.1) 4px
          )`,
        }}
      />

      {/* Horizontal Scan Beam */}
      <div
        className={`absolute left-0 right-0 h-1 gpu-layer transition-opacity duration-500 ${
          phase >= 1 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.8), transparent)',
          animation: phase >= 1 ? 'scan-vertical 3s ease-in-out infinite' : 'none',
        }}
      />

      {/* Central HUD Frame */}
      <div
        className={`absolute left-1/2 top-1/2 gpu-layer transition-all duration-1000 ${
          phase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}
        style={{ transform: `translate(-50%, -50%) ${phase >= 2 ? 'scale(1)' : 'scale(0.75)'}` }}
      >
        {/* Outer rotating hexagon */}
        <div
          className="absolute -inset-32 flex items-center justify-center gpu-layer"
          style={{ animation: 'rotate-slow 20s linear infinite' }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <polygon
              points="100,10 190,50 190,150 100,190 10,150 10,50"
              fill="none"
              stroke="rgba(0, 255, 255, 0.2)"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Inner rotating ring */}
        <div
          className="absolute -inset-20 rounded-full border border-cyan-500/30 gpu-layer"
          style={{ animation: 'rotate-slow 10s linear infinite reverse' }}
        >
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-cyan-400 rounded-full"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 30}deg) translateY(-80px)`,
              }}
            />
          ))}
        </div>

        {/* Main HUD Box */}
        <div className="relative w-[500px] h-80 bg-black/80 backdrop-blur-sm border border-cyan-500/50">
          {/* Animated corner brackets */}
          <svg className="absolute -top-2 -left-2 w-8 h-8 text-cyan-400">
            <path d="M0 20 L0 0 L20 0" fill="none" stroke="currentColor" strokeWidth="3" />
          </svg>
          <svg className="absolute -top-2 -right-2 w-8 h-8 text-cyan-400">
            <path d="M32 20 L32 0 L12 0" fill="none" stroke="currentColor" strokeWidth="3" />
          </svg>
          <svg className="absolute -bottom-2 -left-2 w-8 h-8 text-cyan-400">
            <path d="M0 12 L0 32 L20 32" fill="none" stroke="currentColor" strokeWidth="3" />
          </svg>
          <svg className="absolute -bottom-2 -right-2 w-8 h-8 text-cyan-400">
            <path d="M32 12 L32 32 L12 32" fill="none" stroke="currentColor" strokeWidth="3" />
          </svg>

          {/* Content */}
          <div className="h-full flex flex-col items-center justify-center p-8">
            {/* Logo with 3D pop-out effect */}
            <div className={`relative mb-6 transition-opacity duration-500 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
              <div className="relative w-48 h-48" style={{ perspective: '1000px' }}>
                {/* Main logo with 3D depth */}
                <img
                  src="/sm-logo.png"
                  alt="SM Logo"
                  className="relative z-10 w-48 h-48 object-contain gpu-layer"
                  style={{
                    filter: 'drop-shadow(0 12px 35px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 40px rgba(0, 255, 255, 1))',
                    animation: 'logo-3d-pop 3s ease-in-out infinite',
                  }}
                />
              </div>
            </div>

            {/* Glitch text - simplified */}
            <div className={`relative transition-opacity duration-500 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
              <h1
                className="text-4xl font-black text-cyan-400 tracking-wider font-mono"
                style={{
                  textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
                }}
              >
                {glitchText}
              </h1>
            </div>

            {/* Subtitle */}
            <p
              className={`mt-4 text-cyan-300/60 text-sm tracking-[0.3em] font-mono transition-opacity duration-500 ${
                phase >= 4 ? 'opacity-100' : 'opacity-0'
              }`}
            >
              [ SYSTEM v1.0.0 // NDT CORE ]
            </p>

            {/* Status indicators */}
            <div
              className={`mt-6 flex gap-8 transition-opacity duration-500 ${
                phase >= 5 ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {['CORE', 'SCAN', 'DATA', 'LINK'].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full bg-green-400 gpu-layer"
                    style={{
                      animation: `status-blink 1s ease-in-out ${i * 0.15}s infinite`,
                    }}
                  />
                  <span className="text-xs text-green-400 font-mono">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data streams - optimized */}
      <div className={`absolute left-8 top-1/4 bottom-1/4 w-48 overflow-hidden transition-opacity duration-1000 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-xs font-mono text-cyan-500/40 space-y-1 animate-scroll-up">
          {leftStream.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>

      <div className={`absolute right-8 top-1/4 bottom-1/4 w-48 overflow-hidden transition-opacity duration-1000 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-xs font-mono text-cyan-500/40 text-right space-y-1 animate-scroll-down">
          {rightStream.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>

      {/* Bottom status bar */}
      <div
        className={`absolute bottom-8 left-1/2 transition-all duration-700 ${
          phase >= 5 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transform: 'translateX(-50%)' }}
      >
        <div className="flex items-center gap-6 text-xs font-mono text-cyan-500/70 bg-black/50 px-6 py-3 rounded border border-cyan-500/20">
          <span className="text-green-400">SYS_READY</span>
          <span className="text-cyan-400">|</span>
          <span>MEM: 98.7%</span>
          <span className="text-cyan-400">|</span>
          <span>FREQ: 5.0MHz</span>
          <span className="text-cyan-400">|</span>
          <span>TEMP: 23°C</span>
          <span className="text-cyan-400">|</span>
          <span className="text-green-400 animate-pulse">● ONLINE</span>
        </div>
      </div>

      <style>{`
        .gpu-layer {
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        @keyframes scan-vertical {
          0% { top: -5%; }
          100% { top: 105%; }
        }

        @keyframes rotate-slow {
          from { transform: rotate(0deg) translateZ(0); }
          to { transform: rotate(360deg) translateZ(0); }
        }

        @keyframes scroll-up {
          from { transform: translateY(100%) translateZ(0); }
          to { transform: translateY(-100%) translateZ(0); }
        }

        @keyframes scroll-down {
          from { transform: translateY(-100%) translateZ(0); }
          to { transform: translateY(100%) translateZ(0); }
        }

        .animate-scroll-up {
          animation: scroll-up 30s linear infinite;
        }

        .animate-scroll-down {
          animation: scroll-down 30s linear infinite;
        }

        @keyframes logo-3d-pop {
          0%, 100% { transform: translateY(0) scale(1) translateZ(0); }
          50% { transform: translateY(-15px) scale(1.1) translateZ(40px); }
        }

        @keyframes status-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default SplashOption4_TechMatrix;
