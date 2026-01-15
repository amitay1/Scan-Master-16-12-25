/**
 * OPTION 15: Gantry Inspection System Splash Screen
 *
 * מערכת בדיקה מלאה - גנטרי 5 צירים עם בריכה וחלק - תצוגה תעשייתית מרשימה
 */

import React, { useEffect, useState, useRef } from 'react';

const SplashOption15_GantrySystem: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [gantryX, setGantryX] = useState(20);
  const [gantryZ, setGantryZ] = useState(0);
  const [probeAngle, setProbeAngle] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 3500),
      setTimeout(() => setPhase(5), 4500),
      setTimeout(() => onComplete?.(), 5500),
    ];

    // Gantry motion simulation
    let xDir = 1;
    const motionInterval = setInterval(() => {
      setGantryX((prev) => {
        if (prev >= 80) xDir = -1;
        if (prev <= 20) xDir = 1;
        return prev + xDir * 0.4;
      });
      setGantryZ((prev) => Math.min(prev + 0.5, 40));
      setProbeAngle((prev) => Math.sin(Date.now() * 0.002) * 15);
    }, 30);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(motionInterval);
    };
  }, [onComplete]);

  // Water and beam effects
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
      r: number;
      speed: number;
    }

    const bubbles: Bubble[] = [];
    let animationId: number;
    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const tankLeft = canvas.width * 0.15;
      const tankRight = canvas.width * 0.85;
      const tankTop = canvas.height * 0.45;
      const tankBottom = canvas.height * 0.85;
      const waterTop = tankTop + 30;

      // Draw ultrasonic beam from probe
      if (phase >= 3) {
        const probeX = tankLeft + ((tankRight - tankLeft) * gantryX) / 100;
        const probeY = tankTop + 80 + gantryZ;
        const beamEndY = tankBottom - 50;

        // Main beam
        ctx.beginPath();
        const beamWidth = 40;
        ctx.moveTo(probeX, probeY);
        ctx.lineTo(probeX - beamWidth / 2, beamEndY);
        ctx.lineTo(probeX + beamWidth / 2, beamEndY);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(probeX, probeY, probeX, beamEndY);
        gradient.addColorStop(0, 'rgba(0, 200, 255, 0.5)');
        gradient.addColorStop(0.5, 'rgba(0, 150, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 100, 255, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Scan waves
        for (let i = 0; i < 5; i++) {
          const waveY = probeY + ((time * 3 + i * 30) % (beamEndY - probeY));
          const progress = (waveY - probeY) / (beamEndY - probeY);
          const waveWidth = 5 + progress * 20;

          ctx.beginPath();
          ctx.arc(probeX, waveY, waveWidth, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 255, 255, ${0.6 - progress * 0.5})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Reflection point on part
        ctx.beginPath();
        ctx.arc(probeX, beamEndY, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 200, 0, 0.6)';
        ctx.fill();
      }

      // Bubbles in water
      if (phase >= 2 && Math.random() > 0.8) {
        bubbles.push({
          x: tankLeft + 50 + Math.random() * (tankRight - tankLeft - 100),
          y: tankBottom - 30,
          r: 2 + Math.random() * 4,
          speed: 0.5 + Math.random() * 1.5,
        });
      }

      bubbles.forEach((bubble, i) => {
        bubble.y -= bubble.speed;
        if (bubble.y < waterTop) {
          bubbles.splice(i, 1);
          return;
        }

        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(150, 220, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      time++;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [phase, gantryX, gantryZ]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#1a2030] via-[#151d2a] to-[#0a1018] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />

      {/* Industrial floor */}
      <div
        className="absolute bottom-0 left-0 right-0 h-20"
        style={{
          background: 'linear-gradient(180deg, #2a3040 0%, #1a2030 100%)',
          boxShadow: 'inset 0 5px 20px rgba(0,0,0,0.5)',
        }}
      >
        {/* Floor markings */}
        <div className="absolute inset-x-[10%] top-2 bottom-2 border-2 border-dashed border-yellow-500/30 rounded" />
      </div>

      {/* Gantry frame structure */}
      <div className={`absolute inset-x-[10%] top-[10%] bottom-[10%] transition-opacity duration-500 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        {/* Left pillar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-8"
          style={{
            background: 'linear-gradient(90deg, #4a5568, #718096, #4a5568)',
            boxShadow: '5px 0 15px rgba(0,0,0,0.3)',
          }}
        >
          <div className="absolute inset-x-1 top-4 bottom-4 bg-slate-600 rounded" />
        </div>

        {/* Right pillar */}
        <div
          className="absolute right-0 top-0 bottom-0 w-8"
          style={{
            background: 'linear-gradient(90deg, #4a5568, #718096, #4a5568)',
            boxShadow: '-5px 0 15px rgba(0,0,0,0.3)',
          }}
        >
          <div className="absolute inset-x-1 top-4 bottom-4 bg-slate-600 rounded" />
        </div>

        {/* Top cross beam (X-axis rail) */}
        <div
          className="absolute left-0 right-0 top-8 h-10"
          style={{
            background: 'linear-gradient(180deg, #5a6878, #4a5868, #3a4858)',
            boxShadow: '0 5px 20px rgba(0,0,0,0.4)',
          }}
        >
          {/* Rail groove */}
          <div className="absolute inset-x-8 top-3 h-4 bg-slate-700 rounded" />
        </div>

        {/* X-axis carriage */}
        <div
          className="absolute top-6 transition-all duration-100"
          style={{
            left: `${gantryX}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className="w-20 h-14 rounded-lg"
            style={{
              background: 'linear-gradient(180deg, #ff6b00, #cc5500)',
              boxShadow: '0 5px 20px rgba(0,0,0,0.4)',
            }}
          >
            <div className="absolute inset-2 bg-slate-800/50 rounded flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
          </div>

          {/* Z-axis (vertical) arm */}
          <div
            className="absolute top-12 left-1/2 -translate-x-1/2 w-6 transition-all duration-100"
            style={{
              height: `${80 + gantryZ * 2}px`,
              background: 'linear-gradient(90deg, #5a6878, #6a7888, #5a6878)',
            }}
          >
            {/* Probe holder */}
            <div
              className={`absolute -bottom-10 left-1/2 transition-all duration-300 ${
                phase >= 2 ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                transform: `translateX(-50%) rotate(${probeAngle}deg)`,
              }}
            >
              <div
                className="w-14 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(180deg, #ff8800, #dd6600)',
                }}
              >
                {/* Probe */}
                <div className="w-8 h-12 bg-gradient-to-b from-slate-600 to-slate-800 rounded-b-lg relative">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-3 bg-cyan-400 rounded-b-lg" />
                  {/* Active indicator */}
                  <div
                    className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full ${
                      phase >= 3 ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{
                      background: 'radial-gradient(circle, rgba(0,200,255,0.6) 0%, transparent 70%)',
                      animation: phase >= 3 ? 'probe-glow 0.8s ease-in-out infinite' : 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tank */}
      <div className="absolute inset-x-[15%] top-[45%] bottom-[15%]">
        {/* Tank walls */}
        <div
          className="absolute inset-0 border-4 border-slate-500 rounded-lg"
          style={{
            background: 'linear-gradient(180deg, rgba(20,40,60,0.5) 0%, rgba(10,30,50,0.7) 100%)',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5), 0 10px 40px rgba(0,0,0,0.4)',
          }}
        />

        {/* Water */}
        <div
          className={`absolute inset-x-1 bottom-1 rounded-b-md transition-all duration-1000 ${
            phase >= 2 ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            top: '15%',
            background: 'linear-gradient(180deg, rgba(0,100,150,0.4) 0%, rgba(0,80,130,0.6) 50%, rgba(0,60,110,0.7) 100%)',
          }}
        >
          {/* Water surface shine */}
          <div
            className="absolute top-0 left-0 right-0 h-6"
            style={{
              background: 'linear-gradient(180deg, rgba(150,200,255,0.3) 0%, transparent 100%)',
            }}
          />
        </div>

        {/* Test part on rotary table */}
        <div className={`absolute bottom-[10%] left-1/2 -translate-x-1/2 transition-all duration-700 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
          {/* Rotary table */}
          <div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-48 h-6 rounded-full"
            style={{
              background: 'linear-gradient(180deg, #4a5a6a, #3a4a5a)',
              boxShadow: '0 3px 15px rgba(0,0,0,0.5)',
            }}
          />
          {/* Turbine blade part */}
          <div
            className="w-40 h-24 relative"
            style={{
              background: 'linear-gradient(135deg, #8a9aaa 0%, #6a7a8a 50%, #5a6a7a 100%)',
              borderRadius: '10% 50% 50% 10% / 50%',
              boxShadow: '0 5px 20px rgba(0,0,0,0.4)',
            }}
          />
        </div>
      </div>

      {/* Control panel */}
      <div className={`absolute left-4 bottom-24 transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-slate-800/90 backdrop-blur rounded-lg p-3 border border-slate-600 w-48">
          <div className="text-[10px] font-mono text-slate-400 mb-2">AXIS POSITION</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[8px] text-slate-500">X</div>
              <div className="text-xs font-mono text-cyan-400">{gantryX.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-[8px] text-slate-500">Y</div>
              <div className="text-xs font-mono text-cyan-400">0.0</div>
            </div>
            <div>
              <div className="text-[8px] text-slate-500">Z</div>
              <div className="text-xs font-mono text-cyan-400">{gantryZ.toFixed(1)}</div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">STATUS</span>
              <span className={`text-[10px] font-mono ${phase >= 3 ? 'text-green-400' : 'text-yellow-400'}`}>
                {phase >= 3 ? 'SCANNING' : 'POSITIONING'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="absolute top-4 right-4 z-20">
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
              className="relative w-40 h-40 object-contain"
              style={{
                filter: 'drop-shadow(0 12px 35px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 50px rgba(255, 120, 0, 1))',
                transform: 'translateZ(50px)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center z-20">
        <h1
          className={`text-3xl font-black tracking-wider transition-all duration-700 ${
            phase >= 5 ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(90deg, #ff8800, #ffcc00, #ff8800)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          SCAN-MASTER
        </h1>
        <p className={`mt-1 text-orange-400/60 tracking-[0.2em] text-[10px] transition-opacity duration-500 ${phase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
          5-AXIS GANTRY INSPECTION SYSTEM
        </p>
      </div>

      <style>{`
        .gpu-layer {
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        @keyframes probe-glow {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.6; }
          50% { transform: translateX(-50%) scale(1.3); opacity: 0.8; }
        }

        @keyframes logo-3d-pop {
          0%, 100% { transform: translateY(0) scale(1) translateZ(0); }
          50% { transform: translateY(-18px) scale(1.1) translateZ(40px); }
        }
      `}</style>
    </div>
  );
};

export default SplashOption15_GantrySystem;
