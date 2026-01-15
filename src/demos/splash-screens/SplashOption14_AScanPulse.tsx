/**
 * OPTION 14: A-Scan Pulse Splash Screen
 *
 * תצוגת A-Scan עם גלים אולטרסוניים חיים - הלוגו נוצר מתוך הפולס
 */

import React, { useEffect, useState, useRef } from 'react';

const SplashOption14_AScanPulse: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 3200),
      setTimeout(() => setPhase(5), 4300),
      setTimeout(() => onComplete?.(), 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // A-Scan waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth * 0.8;
    canvas.height = 300;

    let animationId: number;
    let time = 0;

    const draw = () => {
      // Dark background with scan lines
      ctx.fillStyle = '#0a1520';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = 'rgba(0, 100, 150, 0.3)';
      ctx.lineWidth = 0.5;

      // Vertical grid lines
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Center line (0%)
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Gate areas
      if (phase >= 2) {
        // Gate 1 (Interface)
        ctx.fillStyle = 'rgba(255, 100, 0, 0.1)';
        ctx.fillRect(canvas.width * 0.08, 0, canvas.width * 0.12, canvas.height);
        ctx.strokeStyle = 'rgba(255, 100, 0, 0.5)';
        ctx.strokeRect(canvas.width * 0.08, 0, canvas.width * 0.12, canvas.height);

        // Gate 2 (Defect zone)
        ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
        ctx.fillRect(canvas.width * 0.35, 0, canvas.width * 0.25, canvas.height);
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.strokeRect(canvas.width * 0.35, 0, canvas.width * 0.25, canvas.height);

        // Gate 3 (Back wall)
        ctx.fillStyle = 'rgba(0, 255, 100, 0.1)';
        ctx.fillRect(canvas.width * 0.75, 0, canvas.width * 0.15, canvas.height);
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.5)';
        ctx.strokeRect(canvas.width * 0.75, 0, canvas.width * 0.15, canvas.height);
      }

      // A-Scan waveform
      if (phase >= 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;

        const centerY = canvas.height / 2;

        for (let x = 0; x < canvas.width; x++) {
          const t = x / canvas.width;
          let amplitude = 0;

          // Initial pulse (interface echo)
          const pulse1Pos = 0.12;
          const pulse1 = Math.exp(-Math.pow((t - pulse1Pos) * 30, 2)) * 0.9;

          // Multiple reflections (defects)
          const pulse2Pos = 0.42;
          const pulse2 = Math.exp(-Math.pow((t - pulse2Pos) * 25, 2)) * 0.4;

          const pulse3Pos = 0.52;
          const pulse3 = Math.exp(-Math.pow((t - pulse3Pos) * 20, 2)) * 0.25;

          // Back wall echo
          const pulse4Pos = 0.82;
          const pulse4 = Math.exp(-Math.pow((t - pulse4Pos) * 35, 2)) * 0.85;

          amplitude = pulse1 + pulse2 + pulse3 + pulse4;

          // Add RF oscillation
          const freq = 40 + Math.sin(time * 0.02) * 5;
          const rf = Math.sin(t * freq + time * 0.1) * amplitude;

          // Add noise
          const noise = (Math.random() - 0.5) * 0.02;

          const y = centerY - (rf + noise) * (canvas.height * 0.4);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Amplitude markers
      if (phase >= 2) {
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(0, 200, 255, 0.7)';
        ctx.textAlign = 'right';
        ctx.fillText('100%', 35, 25);
        ctx.fillText('50%', 35, canvas.height * 0.25 + 5);
        ctx.fillText('0%', 35, canvas.height / 2 + 5);
        ctx.fillText('-50%', 35, canvas.height * 0.75 + 5);
        ctx.fillText('-100%', 35, canvas.height - 10);

        // Gate labels
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
        ctx.fillText('GATE 1', canvas.width * 0.14, 20);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.fillText('GATE 2', canvas.width * 0.475, 20);
        ctx.fillStyle = 'rgba(0, 255, 100, 0.8)';
        ctx.fillText('GATE 3', canvas.width * 0.825, 20);
      }

      // Time base
      if (phase >= 2) {
        ctx.fillStyle = 'rgba(0, 200, 255, 0.7)';
        ctx.textAlign = 'center';
        for (let i = 0; i <= 10; i++) {
          const x = (i / 10) * canvas.width;
          ctx.fillText(`${i * 10}μs`, x, canvas.height - 5);
        }
      }

      time++;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [phase]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-[#0a1525] to-slate-900 overflow-hidden">
      {/* A-Scan display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`relative transition-all duration-700 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
          {/* Monitor frame */}
          <div
            className="absolute -inset-4 rounded-xl"
            style={{
              background: 'linear-gradient(180deg, #2a3545 0%, #1a2535 100%)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          />

          {/* Screen glow */}
          <div
            className="absolute -inset-1 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,100,100,0.1))',
            }}
          />

          <canvas
            ref={canvasRef}
            className="relative rounded-lg"
            style={{
              boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)',
            }}
          />

          {/* Display info */}
          <div className="absolute -top-12 left-0 right-0 flex justify-between text-xs font-mono">
            <span className="text-cyan-400">A-SCAN RF DISPLAY</span>
            <span className="text-green-400">PRF: 2000 Hz</span>
            <span className="text-yellow-400">GAIN: 42 dB</span>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2">
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
              className="relative w-48 h-48 object-contain"
              style={{
                filter: 'drop-shadow(0 12px 35px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 50px rgba(0, 255, 136, 1))',
                transform: 'translateZ(50px)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Measurement readouts */}
      <div className={`absolute left-8 top-1/2 -translate-y-1/2 transition-opacity duration-500 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-slate-800/90 backdrop-blur rounded-lg p-4 border border-green-500/30 space-y-3">
          <div>
            <div className="text-[10px] text-slate-400 font-mono">INTERFACE</div>
            <div className="text-lg font-bold text-orange-400 font-mono">12.5 μs</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono">THICKNESS</div>
            <div className="text-lg font-bold text-cyan-400 font-mono">25.4 mm</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono">AMPLITUDE</div>
            <div className="text-lg font-bold text-green-400 font-mono">85%</div>
          </div>
        </div>
      </div>

      {/* Gate readings */}
      <div className={`absolute right-8 top-1/2 -translate-y-1/2 transition-opacity duration-500 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-slate-800/90 backdrop-blur rounded-lg p-4 border border-cyan-500/30 space-y-2">
          <div className="text-[10px] text-slate-400 font-mono mb-2">GATE STATUS</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="text-xs font-mono text-orange-400">G1: 90%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-xs font-mono text-yellow-400">G2: 40%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs font-mono text-green-400">G3: 85%</span>
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
            background: 'linear-gradient(90deg, #00ff88, #00ffcc, #00ff88)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          SCAN-MASTER
        </h1>
        <p className={`mt-2 text-green-400/60 tracking-[0.3em] text-xs transition-opacity duration-500 ${phase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
          ULTRASONIC A-SCAN ANALYSIS
        </p>
      </div>

      <style>{`
        .gpu-layer {
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        @keyframes logo-3d-pop {
          0%, 100% { transform: translateY(0) scale(1) translateZ(0); }
          50% { transform: translateY(-18px) scale(1.1) translateZ(40px); }
        }
      `}</style>
    </div>
  );
};

export default SplashOption14_AScanPulse;
