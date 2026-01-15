/**
 * OPTION 1: Ultrasonic Waves Splash Screen - OPTIMIZED FOR SMOOTH ANIMATIONS
 *
 * GPU-accelerated animations with smooth 60fps performance
 */

import React, { useEffect, useState, useRef } from 'react';

const SplashOption1_UltrasonicWaves: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // A-Scan waveform animation with optimized rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 120;

    let animationId: number;
    let time = 0;
    let lastTime = 0;

    const drawAScan = (currentTime: number) => {
      // Throttle to ~30fps for canvas (sufficient for waveform display)
      if (currentTime - lastTime < 33) {
        animationId = requestAnimationFrame(drawAScan);
        return;
      }
      lastTime = currentTime;

      ctx.fillStyle = '#000a14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid - simplified
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        ctx.moveTo(i * 40, 0);
        ctx.lineTo(i * 40, canvas.height);
      }
      for (let i = 0; i < 6; i++) {
        ctx.moveTo(0, i * 20);
        ctx.lineTo(canvas.width, i * 20);
      }
      ctx.stroke();

      // Waveform - no shadow for performance
      ctx.beginPath();
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;

      for (let x = 0; x < canvas.width; x += 2) { // Skip every other pixel
        const t = x / canvas.width;
        let y = 60;

        if (t < 0.1) {
          y -= Math.sin((t + time * 0.02) * 80) * Math.exp(-t * 25) * 50;
        }
        if (t > 0.3 && t < 0.4) {
          y -= Math.sin((t - 0.3 + time * 0.02) * 100) * Math.exp(-(t - 0.3) * 25) * 35;
        }
        if (t > 0.6 && t < 0.7) {
          y -= Math.sin((t - 0.6 + time * 0.02) * 100) * Math.exp(-(t - 0.6) * 25) * 20;
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Scan line
      const scanX = (time * 3) % canvas.width;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(scanX, 0);
      ctx.lineTo(scanX, canvas.height);
      ctx.stroke();

      time++;
      animationId = requestAnimationFrame(drawAScan);
    };

    animationId = requestAnimationFrame(drawAScan);
    return () => cancelAnimationFrame(animationId);
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 2200),
      setTimeout(() => setPhase(5), 3000),
      setTimeout(() => onComplete?.(), 5000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#000a14] flex items-center justify-center overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0">
        <svg width="100%" height="100%" className="opacity-20">
          <defs>
            <pattern id="grid-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#0088ff" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="grid-fade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="grid-mask">
              <rect width="100%" height="100%" fill="url(#grid-fade)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" mask="url(#grid-mask)" />
        </svg>
      </div>

      {/* Ultrasonic Pulse Waves - GPU accelerated */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none gpu-layer">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full border gpu-layer ${
              phase >= 2 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              width: `${100 + i * 80}px`,
              height: `${100 + i * 80}px`,
              borderColor: `rgba(0, 200, 255, ${0.5 - i * 0.05})`,
              borderWidth: '2px',
              animation: phase >= 2 ? `wave-pulse 3s ease-out ${i * 0.2}s infinite` : 'none',
            }}
          />
        ))}
      </div>

      {/* Scanning Beams - GPU accelerated */}
      {phase >= 3 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="absolute w-1 h-[500px] gpu-layer"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(0, 255, 255, 0.6), transparent)',
              animation: 'beam-rotate 4s linear infinite',
            }}
          />
          <div
            className="absolute w-1 h-[500px] gpu-layer"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(0, 150, 255, 0.4), transparent)',
              animation: 'beam-rotate 4s linear infinite reverse',
            }}
          />
        </div>
      )}

      {/* A-Scan Display */}
      <div
        className={`absolute top-8 left-1/2 gpu-layer transition-opacity duration-700 ${
          phase >= 2 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transform: 'translateX(-50%)' }}
      >
        <div className="bg-black/50 border border-cyan-500/30 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-cyan-400 text-xs font-mono mb-2 flex justify-between">
            <span>A-SCAN DISPLAY</span>
            <span className="animate-pulse">● LIVE</span>
          </div>
          <canvas ref={canvasRef} className="rounded" />
        </div>
      </div>

      {/* Central Logo - Optimized animations */}
      <div
        className={`relative z-10 gpu-layer transition-transform duration-1000 ${
          phase >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        }`}
      >
        {/* Outer glow ring */}
        <div
          className="absolute -inset-12 rounded-full opacity-50 gpu-layer"
          style={{
            background: 'radial-gradient(circle, rgba(0, 150, 255, 0.4) 0%, transparent 70%)',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        />

        {/* Energy particles orbiting - reduced count */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 w-3 h-3 -ml-1.5 -mt-1.5 gpu-layer"
            style={{
              animation: `orbit-particle 3s linear ${i * 0.5}s infinite`,
            }}
          >
            <div
              className="w-full h-full rounded-full bg-cyan-400"
              style={{
                boxShadow: '0 0 10px 3px rgba(0, 255, 255, 0.8)',
              }}
            />
          </div>
        ))}

        {/* Logo container */}
        <div className="relative w-80 h-80 flex items-center justify-center">
          {/* Outer rotating ring - simplified */}
          <div
            className="absolute inset-0 rounded-full border-2 border-cyan-500/50 gpu-layer"
            style={{
              animation: 'rotate-border 3s linear infinite',
            }}
          />

          {/* Middle rotating ring */}
          <div
            className="absolute inset-3 rounded-full border border-cyan-500/30 gpu-layer"
            style={{
              animation: 'rotate-border 5s linear infinite reverse',
            }}
          />

          {/* Inner glow */}
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20" />

          {/* Hexagon frame */}
          <svg className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] gpu-layer" viewBox="0 0 100 100">
            <polygon
              points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
              fill="none"
              stroke="rgba(0, 255, 255, 0.3)"
              strokeWidth="1"
              className="hexagon-pulse"
            />
          </svg>

          {/* Logo with 3D pop-out effect */}
          <div className="relative gpu-layer" style={{
            animation: 'logo-3d-pop 3s ease-in-out infinite',
            perspective: '1000px',
          }}>
            {/* Main logo with 3D depth */}
            <img
              src="/sm-logo.png"
              alt="SM Logo"
              className="relative z-10 w-56 h-56 object-contain"
              style={{
                filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 40px rgba(0, 150, 255, 1))',
                transform: 'translateZ(50px)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Title Section */}
      <div className="absolute bottom-1/4 left-1/2 text-center gpu-layer" style={{ transform: 'translateX(-50%)' }}>
        <h1
          className={`text-5xl font-black tracking-wider transition-all duration-700 ${
            phase >= 4 ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #00d4ff 50%, #0088ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          SCAN-MASTER
        </h1>

        <div
          className={`mt-4 flex items-center justify-center gap-4 transition-opacity duration-700 ${
            phase >= 4 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          <p className="text-cyan-300/80 tracking-[0.3em] text-sm uppercase font-light">
            Ultrasonic Inspection System
          </p>
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        </div>

        {/* Loading bar */}
        <div
          className={`mt-8 w-80 mx-auto transition-opacity duration-500 ${
            phase >= 5 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 rounded-full"
              style={{
                animation: 'loading-progress 2s ease-out forwards',
              }}
            />
          </div>
          <p className="mt-3 text-cyan-400/60 text-xs font-mono animate-pulse">
            INITIALIZING TRANSDUCER ARRAY...
          </p>
        </div>
      </div>

      {/* Corner HUD Elements */}
      <div className={`absolute top-6 left-6 font-mono text-xs transition-opacity duration-500 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-cyan-400/70 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>FREQ: 5.0 MHz</span>
          </div>
          <div>GAIN: 42 dB</div>
          <div>VELOCITY: 5920 m/s</div>
        </div>
      </div>

      <div className={`absolute top-6 right-6 font-mono text-xs text-right transition-opacity duration-500 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="text-cyan-400/70 space-y-1">
          <div>PROBE: 70° L-WAVE</div>
          <div>RANGE: 250mm</div>
          <div>MODE: PULSE-ECHO</div>
        </div>
      </div>

      {/* Bottom corners */}
      <div className={`absolute bottom-6 left-6 transition-opacity duration-500 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
        <svg width="80" height="80" className="text-cyan-500/30">
          <path d="M0 30 L0 0 L30 0" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M0 50 L0 80 L30 80" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      <div className={`absolute bottom-6 right-6 transition-opacity duration-500 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
        <svg width="80" height="80" className="text-cyan-500/30">
          <path d="M80 30 L80 0 L50 0" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M80 50 L80 80 L50 80" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      <style>{`
        .gpu-layer {
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        @keyframes wave-pulse {
          0% { transform: scale(0.8) translateZ(0); opacity: 0.6; }
          50% { transform: scale(1) translateZ(0); opacity: 0.3; }
          100% { transform: scale(1.2) translateZ(0); opacity: 0; }
        }

        @keyframes beam-rotate {
          from { transform: rotate(0deg) translateZ(0); }
          to { transform: rotate(360deg) translateZ(0); }
        }

        @keyframes pulse-glow {
          0%, 100% { transform: scale(1) translateZ(0); opacity: 0.5; }
          50% { transform: scale(1.2) translateZ(0); opacity: 0.8; }
        }

        @keyframes rotate-border {
          from { transform: rotate(0deg) translateZ(0); }
          to { transform: rotate(360deg) translateZ(0); }
        }

        @keyframes loading-progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        @keyframes orbit-particle {
          from { transform: rotate(0deg) translateX(100px) translateZ(0); }
          to { transform: rotate(360deg) translateX(100px) translateZ(0); }
        }

        @keyframes logo-3d-pop {
          0%, 100% { transform: translateY(0) scale(1) translateZ(0); }
          50% { transform: translateY(-15px) scale(1.08) translateZ(30px); }
        }

        .hexagon-pulse {
          animation: hexagon-pulse 2s ease-in-out infinite;
        }

        @keyframes hexagon-pulse {
          0%, 100% { stroke-opacity: 0.3; }
          50% { stroke-opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

export default SplashOption1_UltrasonicWaves;
