/**
 * OPTION 11: Immersion Tank Splash Screen
 *
 * בריכת בדיקה אולטרסונית עם מים מתמלאים וזרוע רובוטית יורדת לסריקה
 */

import React, { useEffect, useState, useRef } from 'react';

const SplashOption11_ImmersionTank: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [waterLevel, setWaterLevel] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 3000),
      setTimeout(() => setPhase(5), 4200),
      setTimeout(() => onComplete?.(), 5500),
    ];

    // Water filling animation
    const waterInterval = setInterval(() => {
      setWaterLevel((prev) => Math.min(prev + 1.5, 70));
    }, 40);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(waterInterval);
    };
  }, [onComplete]);

  // Bubbles and water effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Bubble {
      x: number;
      y: number;
      radius: number;
      speed: number;
      wobble: number;
    }

    const bubbles: Bubble[] = [];
    let animationId: number;
    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const tankLeft = canvas.width * 0.2;
      const tankRight = canvas.width * 0.8;
      const tankBottom = canvas.height * 0.85;
      const waterTop = tankBottom - (tankBottom * waterLevel) / 100;

      // Add bubbles
      if (Math.random() > 0.7 && waterLevel > 20) {
        bubbles.push({
          x: tankLeft + Math.random() * (tankRight - tankLeft),
          y: tankBottom - 20,
          radius: 2 + Math.random() * 6,
          speed: 1 + Math.random() * 2,
          wobble: Math.random() * Math.PI * 2,
        });
      }

      // Draw and update bubbles
      bubbles.forEach((bubble, i) => {
        bubble.y -= bubble.speed;
        bubble.x += Math.sin(time * 0.05 + bubble.wobble) * 0.5;

        if (bubble.y < waterTop || bubble.y < 0) {
          bubbles.splice(i, 1);
          return;
        }

        // Bubble
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(150, 220, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Highlight
        ctx.beginPath();
        ctx.arc(bubble.x - bubble.radius * 0.3, bubble.y - bubble.radius * 0.3, bubble.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
      });

      // Draw ultrasonic waves from probe
      if (phase >= 3) {
        const probeX = canvas.width / 2;
        const probeY = canvas.height * 0.35;

        for (let i = 0; i < 5; i++) {
          const waveRadius = ((time * 2 + i * 30) % 150);
          const alpha = 1 - waveRadius / 150;

          ctx.beginPath();
          ctx.arc(probeX, probeY, waveRadius, 0.3 * Math.PI, 0.7 * Math.PI);
          ctx.strokeStyle = `rgba(0, 200, 255, ${alpha * 0.5})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      time++;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [phase, waterLevel]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />

      {/* Tank structure */}
      <div className="absolute inset-x-[20%] top-[15%] bottom-[15%]">
        {/* Tank walls */}
        <div
          className="absolute inset-0 border-4 border-slate-600 rounded-b-lg"
          style={{
            background: 'linear-gradient(180deg, rgba(30,40,60,0.3) 0%, rgba(20,30,50,0.5) 100%)',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5), 0 0 30px rgba(0,150,255,0.1)',
          }}
        />

        {/* Water */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-100"
          style={{
            height: `${waterLevel}%`,
            background: 'linear-gradient(180deg, rgba(0,150,255,0.3) 0%, rgba(0,100,200,0.5) 50%, rgba(0,80,180,0.6) 100%)',
            borderRadius: '0 0 4px 4px',
          }}
        >
          {/* Water surface */}
          <div
            className="absolute top-0 left-0 right-0 h-4"
            style={{
              background: 'linear-gradient(180deg, rgba(150,220,255,0.4) 0%, transparent 100%)',
              animation: 'water-wave 2s ease-in-out infinite',
            }}
          />
        </div>

        {/* Test part (cylinder) on platform */}
        <div
          className={`absolute bottom-[10%] left-1/2 -translate-x-1/2 transition-all duration-1000 ${
            phase >= 1 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="w-32 h-20 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, #8090a0 0%, #506070 50%, #405060 100%)',
              boxShadow: '0 5px 20px rgba(0,0,0,0.5)',
            }}
          />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-40 h-3 bg-slate-700 rounded" />
        </div>
      </div>

      {/* Gantry system */}
      <div className={`absolute top-0 left-[15%] right-[15%] transition-all duration-500 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        {/* Horizontal rail */}
        <div className="absolute top-8 left-0 right-0 h-6 bg-gradient-to-b from-slate-500 to-slate-600 rounded">
          <div className="absolute inset-x-4 top-1 bottom-1 bg-slate-700 rounded" />
        </div>

        {/* Vertical arm carriage */}
        <div
          className="absolute top-6 left-1/2 -translate-x-1/2 w-16 transition-all duration-1000"
          style={{
            transform: `translateX(-50%) translateY(${phase >= 2 ? '0' : '-20px'})`,
          }}
        >
          <div className="w-full h-10 bg-gradient-to-b from-slate-400 to-slate-500 rounded" />

          {/* Vertical arm */}
          <div
            className="absolute top-8 left-1/2 -translate-x-1/2 w-4 bg-gradient-to-b from-slate-500 to-slate-600 rounded transition-all duration-1500"
            style={{
              height: phase >= 2 ? '180px' : '50px',
            }}
          >
            {/* Probe holder */}
            <div
              className={`absolute -bottom-8 left-1/2 -translate-x-1/2 transition-all duration-500 ${
                phase >= 3 ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="w-12 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-slate-800 rounded-full border-2 border-cyan-400" />
              </div>
              {/* Probe tip */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-4 h-8 bg-gradient-to-b from-slate-700 to-slate-800 rounded-b-full">
                <div
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full transition-all ${
                    phase >= 3 ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    background: 'radial-gradient(circle, rgba(0,200,255,0.8) 0%, rgba(0,150,255,0.4) 50%, transparent 70%)',
                    animation: phase >= 3 ? 'probe-pulse 1s ease-in-out infinite' : 'none',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div
          className={`relative transition-all duration-1000 ${
            phase >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
        >
          <div className="relative gpu-layer" style={{
            animation: 'logo-3d-pop 4s ease-in-out infinite',
            perspective: '1000px',
          }}>
            <img
              src="/sm-logo.png"
              alt="SM Logo"
              className="relative w-56 h-56 object-contain"
              style={{
                filter: 'drop-shadow(0 12px 35px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 50px rgba(0, 200, 255, 1))',
                transform: 'translateZ(50px)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center z-20">
        <h1
          className={`text-4xl font-black tracking-wider transition-all duration-700 ${
            phase >= 5 ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(90deg, #60a5fa, #00d4ff, #60a5fa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          SCAN-MASTER
        </h1>
        <p className={`mt-2 text-cyan-400/60 tracking-[0.3em] text-xs transition-opacity duration-500 ${phase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
          IMMERSION TESTING SYSTEMS
        </p>
      </div>

      {/* Status panel */}
      <div className={`absolute top-8 right-8 bg-slate-800/80 backdrop-blur rounded-lg p-4 border border-slate-600 transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-xs font-mono space-y-1">
          <div className="text-slate-400">WATER LEVEL: <span className="text-cyan-400">{Math.round(waterLevel)}%</span></div>
          <div className="text-slate-400">PROBE: <span className={phase >= 3 ? 'text-green-400' : 'text-yellow-400'}>{phase >= 3 ? 'ACTIVE' : 'POSITIONING'}</span></div>
          <div className="text-slate-400">SCAN: <span className={phase >= 3 ? 'text-green-400' : 'text-slate-500'}>{phase >= 3 ? 'IN PROGRESS' : 'STANDBY'}</span></div>
        </div>
      </div>

      <style>{`
        .gpu-layer {
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        @keyframes water-wave {
          0%, 100% { transform: translateX(0) scaleY(1); }
          50% { transform: translateX(10px) scaleY(1.2); }
        }

        @keyframes probe-pulse {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.8; }
          50% { transform: translateX(-50%) scale(1.3); opacity: 1; }
        }

        @keyframes logo-3d-pop {
          0%, 100% { transform: translateY(0) scale(1) translateZ(0); }
          50% { transform: translateY(-18px) scale(1.1) translateZ(40px); }
        }
      `}</style>
    </div>
  );
};

export default SplashOption11_ImmersionTank;
