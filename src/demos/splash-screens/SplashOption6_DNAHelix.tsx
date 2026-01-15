/**
 * OPTION 6: DNA Helix Splash Screen
 *
 * הלוגו נוצר מתוך מבנה DNA מסתובב - אפקט מדעי מרהיב
 */

import React, { useEffect, useState, useRef } from 'react';

const SplashOption6_DNAHelix: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 3000),
      setTimeout(() => setPhase(5), 4000),
      setTimeout(() => onComplete?.(), 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // DNA Helix animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationId: number;
    let time = 0;

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 20, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // DNA Helix parameters
      const helixHeight = 400;
      const helixRadius = 80;
      const segments = 40;
      const rotationSpeed = 0.02;

      for (let i = 0; i < segments; i++) {
        const t = i / segments;
        const y = centerY - helixHeight / 2 + t * helixHeight;
        const angle = t * Math.PI * 4 + time * rotationSpeed;

        // Left strand
        const x1 = centerX + Math.sin(angle) * helixRadius;
        const z1 = Math.cos(angle);

        // Right strand
        const x2 = centerX + Math.sin(angle + Math.PI) * helixRadius;
        const z2 = Math.cos(angle + Math.PI);

        const size1 = 4 + z1 * 2;
        const size2 = 4 + z2 * 2;
        const alpha1 = 0.5 + z1 * 0.5;
        const alpha2 = 0.5 + z2 * 0.5;

        // Draw connecting bars
        if (i % 4 === 0) {
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.strokeStyle = `rgba(0, 200, 255, ${alpha1 * 0.5})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Draw nodes
        ctx.beginPath();
        ctx.arc(x1, y, size1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 150, 255, ${alpha1})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x2, y, size2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 200, ${alpha2})`;
        ctx.fill();
      }

      time++;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#050514] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(5,5,20,0.8) 100%)',
        }}
      />

      {/* Central Logo Area */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`relative transition-all duration-1000 ${
            phase >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
        >
          {/* DNA Frame around logo */}
          <div className="absolute -inset-16">
            <svg viewBox="0 0 200 200" className="w-full h-full gpu-layer" style={{ animation: 'dna-rotate 8s linear infinite' }}>
              {/* Outer helix path */}
              <path
                d="M100,20 Q150,50 100,80 Q50,110 100,140 Q150,170 100,180"
                fill="none"
                stroke="url(#dna-gradient)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M100,20 Q50,50 100,80 Q150,110 100,140 Q50,170 100,180"
                fill="none"
                stroke="url(#dna-gradient-2)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="dna-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00ffff" stopOpacity="0" />
                  <stop offset="50%" stopColor="#00ffff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#00ffff" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="dna-gradient-2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00ff88" stopOpacity="0" />
                  <stop offset="50%" stopColor="#00ff88" stopOpacity="1" />
                  <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Logo with DNA-inspired animation */}
          <div className="relative w-72 h-72 flex items-center justify-center">
            {/* Orbiting DNA nodes */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full gpu-layer"
                style={{
                  background: i % 2 === 0 ? '#00ffff' : '#00ff88',
                  boxShadow: `0 0 15px ${i % 2 === 0 ? '#00ffff' : '#00ff88'}`,
                  animation: `dna-orbit-${i % 2} 3s ease-in-out ${i * 0.5}s infinite`,
                }}
              />
            ))}

            {/* Pulsing rings */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border-2 gpu-layer"
                style={{
                  borderColor: i % 2 === 0 ? 'rgba(0, 255, 255, 0.3)' : 'rgba(0, 255, 136, 0.3)',
                  animation: `dna-pulse ${2 + i * 0.5}s ease-out ${i * 0.3}s infinite`,
                }}
              />
            ))}

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
                  filter: 'drop-shadow(0 12px 35px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 50px rgba(0, 255, 200, 1))',
                  transform: 'translateZ(50px)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 text-center">
        <h1
          className={`text-5xl font-black tracking-wider transition-all duration-1000 ${
            phase >= 4 ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(90deg, #00ffff, #00ff88, #00ffff)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: phase >= 4 ? 'gradient-shift 3s linear infinite' : 'none',
          }}
        >
          SCAN-MASTER
        </h1>
        <p className={`mt-4 text-cyan-300/70 tracking-[0.4em] text-sm transition-opacity duration-700 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          MOLECULAR PRECISION NDT
        </p>
      </div>

      {/* Lab-style indicators */}
      <div className={`absolute top-8 left-8 font-mono text-xs text-cyan-400/60 transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <div>HELIX SYNC: 100%</div>
        <div>MOLECULAR SCAN: ACTIVE</div>
      </div>

      <style>{`
        .gpu-layer {
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        @keyframes dna-rotate {
          from { transform: rotate(0deg) translateZ(0); }
          to { transform: rotate(360deg) translateZ(0); }
        }

        @keyframes dna-orbit-0 {
          0%, 100% { transform: rotate(0deg) translateX(70px) translateZ(0); }
          50% { transform: rotate(180deg) translateX(70px) translateZ(0); }
        }

        @keyframes dna-orbit-1 {
          0%, 100% { transform: rotate(180deg) translateX(70px) translateZ(0); }
          50% { transform: rotate(360deg) translateX(70px) translateZ(0); }
        }

        @keyframes dna-pulse {
          0% { transform: scale(1) translateZ(0); opacity: 0.5; }
          100% { transform: scale(2) translateZ(0); opacity: 0; }
        }

        @keyframes logo-3d-pop {
          0%, 100% { transform: translateY(0) scale(1) translateZ(0); }
          50% { transform: translateY(-18px) scale(1.1) translateZ(40px); }
        }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
};

export default SplashOption6_DNAHelix;
