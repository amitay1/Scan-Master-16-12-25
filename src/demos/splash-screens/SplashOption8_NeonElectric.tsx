/**
 * OPTION 8: Neon Electric Splash Screen
 *
 * שלט ניאון עם אפקטים חשמליים - סגנון רטרו-פיוצ'ריסטי
 */

import React, { useEffect, useState, useRef } from 'react';

const SplashOption8_NeonElectric: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [flicker, setFlicker] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 2500),
      setTimeout(() => setPhase(5), 3500),
      setTimeout(() => onComplete?.(), 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Neon flicker effect
  useEffect(() => {
    if (phase < 2) return;

    const flickerInterval = setInterval(() => {
      if (Math.random() > 0.9) {
        setFlicker(true);
        setTimeout(() => setFlicker(false), 50 + Math.random() * 100);
      }
    }, 200);

    return () => clearInterval(flickerInterval);
  }, [phase]);

  // Electric sparks canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    let animationId: number;

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 5, 20, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Add new sparks occasionally
      if (Math.random() > 0.8) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 100 + Math.random() * 50;
        sparks.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 30 + Math.random() * 20,
        });
      }

      // Update and draw sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.life--;

        if (spark.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        const alpha = spark.life / 50;

        // Draw spark trail
        ctx.beginPath();
        ctx.moveTo(spark.x, spark.y);
        ctx.lineTo(spark.x - spark.vx * 3, spark.y - spark.vy * 3);
        ctx.strokeStyle = `rgba(255, 100, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw spark glow
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#0a0514] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Brick wall texture overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 50px,
              rgba(255,255,255,0.03) 50px,
              rgba(255,255,255,0.03) 52px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 25px,
              rgba(255,255,255,0.03) 25px,
              rgba(255,255,255,0.03) 27px
            )
          `,
        }}
      />

      {/* Neon Sign Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`relative transition-all duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
          {/* Neon tube frame */}
          <div
            className="absolute -inset-8 rounded-2xl gpu-layer"
            style={{
              border: `3px solid ${flicker ? 'rgba(255, 0, 255, 0.3)' : 'rgba(255, 0, 255, 0.8)'}`,
              boxShadow: flicker
                ? '0 0 10px rgba(255, 0, 255, 0.2)'
                : `0 0 20px rgba(255, 0, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3), 0 0 80px rgba(255, 0, 255, 0.2), inset 0 0 20px rgba(255, 0, 255, 0.1)`,
              transition: 'all 0.05s',
            }}
          />

          {/* Inner glow frame */}
          <div
            className="absolute -inset-4 rounded-xl"
            style={{
              border: `2px solid ${flicker ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0, 255, 255, 0.6)'}`,
              boxShadow: flicker
                ? '0 0 5px rgba(0, 255, 255, 0.1)'
                : `0 0 15px rgba(0, 255, 255, 0.4), 0 0 30px rgba(0, 255, 255, 0.2)`,
            }}
          />

          {/* Logo with neon effect */}
          <div className="relative w-72 h-72 flex items-center justify-center">
            {/* Electric arcs around logo */}
            <svg className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)] gpu-layer" style={{ animation: 'neon-arc-rotate 4s linear infinite' }}>
              <defs>
                <filter id="neon-glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {[0, 90, 180, 270].map((angle) => (
                <path
                  key={angle}
                  d={`M 50 10 Q 70 30 90 50`}
                  fill="none"
                  stroke={flicker ? 'rgba(255, 0, 255, 0.3)' : 'rgba(255, 0, 255, 0.8)'}
                  strokeWidth="2"
                  transform={`rotate(${angle} 120 120)`}
                  filter="url(#neon-glow)"
                  style={{ animation: `neon-pulse 0.5s ease-in-out infinite` }}
                />
              ))}
            </svg>

            {/* Logo with 3D pop-out effect */}
            <div className="relative gpu-layer" style={{
              animation: 'logo-3d-pop 4s ease-in-out infinite',
              perspective: '1000px',
            }}>
              <img
                src="/sm-logo.png"
                alt="SM Logo"
                className="relative w-56 h-56 object-contain"
                style={{
                  filter: flicker
                    ? 'drop-shadow(0 8px 25px rgba(0, 0, 0, 0.7)) drop-shadow(0 0 20px rgba(255, 0, 255, 0.4)) brightness(0.8)'
                    : 'drop-shadow(0 12px 35px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 50px rgba(255, 0, 255, 1))',
                  transform: 'translateZ(50px)',
                  transition: 'filter 0.05s',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Neon Title */}
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 text-center">
        <h1
          className={`text-6xl font-black tracking-wider transition-all duration-500 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}
          style={{
            color: flicker ? 'rgba(255, 0, 255, 0.5)' : '#ff00ff',
            textShadow: flicker
              ? '0 0 5px rgba(255, 0, 255, 0.3)'
              : `0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff, 0 0 80px #ff00ff`,
            fontFamily: 'sans-serif',
            transition: 'all 0.05s',
          }}
        >
          SCAN-MASTER
        </h1>
        <p
          className={`mt-6 tracking-[0.5em] text-sm transition-opacity duration-500 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}
          style={{
            color: flicker ? 'rgba(0, 255, 255, 0.3)' : '#00ffff',
            textShadow: flicker
              ? '0 0 3px rgba(0, 255, 255, 0.2)'
              : '0 0 10px #00ffff, 0 0 20px #00ffff',
          }}
        >
          ELECTRIC PRECISION
        </p>
      </div>

      {/* Power indicator */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 transition-opacity duration-500 ${phase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
        <div
          className="w-3 h-3 rounded-full"
          style={{
            background: flicker ? 'rgba(0, 255, 0, 0.3)' : '#00ff00',
            boxShadow: flicker ? '0 0 5px rgba(0, 255, 0, 0.2)' : '0 0 10px #00ff00, 0 0 20px #00ff00',
          }}
        />
        <span
          className="text-xs font-mono"
          style={{
            color: flicker ? 'rgba(0, 255, 0, 0.3)' : '#00ff00',
            textShadow: flicker ? 'none' : '0 0 10px #00ff00',
          }}
        >
          POWER: ON
        </span>
      </div>

      <style>{`
        .gpu-layer {
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        @keyframes neon-arc-rotate {
          from { transform: rotate(0deg) translateZ(0); }
          to { transform: rotate(360deg) translateZ(0); }
        }

        @keyframes neon-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        @keyframes logo-3d-pop {
          0%, 100% { transform: translateY(0) scale(1) translateZ(0); }
          50% { transform: translateY(-18px) scale(1.1) translateZ(40px); }
        }
      `}</style>
    </div>
  );
};

export default SplashOption8_NeonElectric;
