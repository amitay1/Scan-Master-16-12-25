/**
 * OPTION 5: Aerospace Command Center Splash Screen - OPTIMIZED FOR SMOOTH ANIMATIONS
 *
 * GPU-accelerated aerospace command center with smooth 60fps performance
 */

import React, { useEffect, useState, useRef } from 'react';

const SplashOption5_AerospaceCommand: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [systemChecks, setSystemChecks] = useState<string[]>([]);
  const waveformRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1400),
      setTimeout(() => setPhase(4), 2000),
      setTimeout(() => setPhase(5), 2800),
      setTimeout(() => setPhase(6), 3500),
      setTimeout(() => onComplete?.(), 5500),
    ];

    // Loading progress - optimized with RAF
    let progress = 0;
    const updateProgress = () => {
      if (progress < 100) {
        progress = Math.min(progress + 1.5, 100);
        setLoadingProgress(progress);
        requestAnimationFrame(updateProgress);
      }
    };
    requestAnimationFrame(updateProgress);

    // System checks simulation
    const checks = [
      'Initializing transducer array...',
      'Calibrating frequency response...',
      'Loading material database...',
      'Configuring scan parameters...',
      'System ready.',
    ];

    checks.forEach((check, i) => {
      setTimeout(() => {
        setSystemChecks((prev) => [...prev, check]);
      }, 1000 + i * 600);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  // Optimized waveform animation
  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 80;

    let animationId: number;
    let time = 0;
    let lastTime = 0;

    const draw = (currentTime: number) => {
      // Throttle to ~30fps for waveform
      if (currentTime - lastTime < 33) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      lastTime = currentTime;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid - batched draw calls
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        ctx.moveTo(i * 50, 0);
        ctx.lineTo(i * 50, canvas.height);
      }
      for (let i = 0; i <= 4; i++) {
        ctx.moveTo(0, i * 20);
        ctx.lineTo(canvas.width, i * 20);
      }
      ctx.stroke();

      // Waveform - no shadow for performance
      ctx.beginPath();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;

      for (let x = 0; x < canvas.width; x += 2) { // Skip every other pixel
        const t = x / canvas.width;
        let y = 40;

        if (t < 0.08) {
          y -= Math.sin((t + time * 0.03) * 60) * Math.exp(-t * 30) * 35;
        }
        if (t > 0.25 && t < 0.32) {
          y -= Math.sin((t - 0.25 + time * 0.03) * 80) * Math.exp(-(t - 0.25) * 35) * 25;
        }
        if (t > 0.55 && t < 0.62) {
          y -= Math.sin((t - 0.55 + time * 0.03) * 80) * Math.exp(-(t - 0.55) * 35) * 15;
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      time++;
      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Blueprint Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="blueprint-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#3b82f6" strokeWidth="0.5" />
              <path d="M 40 0 L 40 80 M 0 40 L 80 40" fill="none" stroke="#3b82f6" strokeWidth="0.25" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
        </svg>
      </div>

      {/* Top Navigation Bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-14 bg-slate-800/90 border-b border-blue-500/30 flex items-center px-6 gpu-layer transition-all duration-500 ${
          phase >= 1 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transform: phase >= 1 ? 'translateY(0) translateZ(0)' : 'translateY(-100%) translateZ(0)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <img src="/sm-logo.png" alt="SM" className="w-7 h-7 object-contain" style={{ filter: 'brightness(10)' }} />
          </div>
          <div>
            <div className="text-white font-bold text-lg tracking-wide">SCAN-MASTER</div>
            <div className="text-slate-400 text-[10px] tracking-wider">AEROSPACE NDT PLATFORM</div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-8 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 font-medium">SYSTEM ACTIVE</span>
          </div>
          <div className="text-slate-400 font-mono">
            {new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC
          </div>
        </div>
      </div>

      {/* Left Panel - Gauges */}
      <div
        className={`absolute left-0 top-16 bottom-16 w-72 bg-slate-800/60 border-r border-blue-500/20 p-4 gpu-layer transition-all duration-700 ${
          phase >= 2 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transform: phase >= 2 ? 'translateX(0) translateZ(0)' : 'translateX(-100%) translateZ(0)' }}
      >
        <div className="text-[10px] text-blue-400 uppercase tracking-widest mb-4 font-medium">
          System Parameters
        </div>

        {/* Circular Gauges */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'FREQ', value: 5.0, unit: 'MHz', max: 10, color: '#3b82f6' },
            { label: 'GAIN', value: 42, unit: 'dB', max: 80, color: '#22d3ee' },
          ].map((gauge) => (
            <div
              key={gauge.label}
              className={`bg-slate-900/60 rounded-xl p-3 border border-slate-700 transition-opacity duration-500 ${
                phase >= 3 ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <svg viewBox="0 0 100 100" className="w-full">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={gauge.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(gauge.value / gauge.max) * 251} 251`}
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-1000"
                />
                <text x="50" y="45" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
                  {gauge.value}
                </text>
                <text x="50" y="60" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">
                  {gauge.unit}
                </text>
              </svg>
              <div className="text-center text-[10px] text-slate-400 mt-1">{gauge.label}</div>
            </div>
          ))}
        </div>

        {/* Linear Gauges */}
        {[
          { label: 'Velocity', value: 5920, unit: 'm/s', max: 8000 },
          { label: 'Range', value: 250, unit: 'mm', max: 500 },
          { label: 'Water Path', value: 12, unit: 'mm', max: 50 },
        ].map((gauge, i) => (
          <div
            key={gauge.label}
            className={`mb-4 transition-opacity duration-500 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">{gauge.label}</span>
              <span className="text-white font-mono">
                {gauge.value} <span className="text-slate-500">{gauge.unit}</span>
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000"
                style={{ width: phase >= 3 ? `${(gauge.value / gauge.max) * 100}%` : '0%' }}
              />
            </div>
          </div>
        ))}

        {/* A-Scan Waveform */}
        <div
          className={`mt-6 bg-slate-900/60 rounded-lg p-3 border border-slate-700 transition-opacity duration-500 ${
            phase >= 4 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] text-slate-400 uppercase">A-Scan Preview</span>
            <span className="text-[10px] text-green-400 animate-pulse">● LIVE</span>
          </div>
          <canvas ref={waveformRef} className="w-full rounded" />
        </div>
      </div>

      {/* Main Center Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`text-center gpu-layer transition-all duration-1000 ${
            phase >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          {/* Main Logo Section */}
          <div className="relative mb-8">
            {/* Radar sweep - simplified */}
            <div className="absolute inset-0 -m-24 flex items-center justify-center">
              <div
                className="w-96 h-96 rounded-full gpu-layer"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, rgba(59, 130, 246, 0.3) 30deg, transparent 60deg)',
                  animation: 'radar-sweep 4s linear infinite',
                }}
              />
            </div>

            {/* Concentric circles - reduced */}
            {[1, 2, 3].map((ring) => (
              <div
                key={ring}
                className="absolute left-1/2 top-1/2 rounded-full border border-blue-500/20"
                style={{
                  width: `${ring * 100}px`,
                  height: `${ring * 100}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}

            {/* Logo Badge */}
            <div className="relative w-72 h-72 mx-auto">
              {/* Outer rotating tech ring */}
              <div
                className="absolute inset-0 rounded-full border-2 border-dashed border-blue-500/30 gpu-layer"
                style={{ animation: 'rotate-tech-ring 15s linear infinite' }}
              />

              {/* Main badge background */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-blue-500/50" />

              {/* Inner dark circle */}
              <div className="absolute inset-7 rounded-full bg-slate-900/95 border border-slate-600">
                {/* Logo container with 3D pop-out */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '1000px' }}>
                  <div className="relative gpu-layer" style={{ animation: 'logo-3d-pop 4s ease-in-out infinite' }}>
                    {/* Main logo with 3D depth */}
                    <img
                      src="/sm-logo.png"
                      alt="SM Logo"
                      className="relative w-40 h-40 object-contain"
                      style={{
                        filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 40px rgba(59, 130, 246, 1))',
                        transform: 'translateZ(40px)',
                      }}
                    />
                  </div>
                </div>

                {/* Status indicators around logo */}
                {[0, 90, 180, 270].map((angle, i) => (
                  <div
                    key={angle}
                    className="absolute w-2 h-2 bg-green-500 rounded-full gpu-layer"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `rotate(${angle}deg) translateY(-55px) translateX(-4px)`,
                      animation: `status-blink-aerospace 1.5s ease-in-out ${i * 0.3}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Title */}
          <h1
            className={`text-5xl font-bold transition-all duration-700 ${
              phase >= 5 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="text-white">SCAN-</span>
            <span className="text-blue-400">MASTER</span>
          </h1>

          <p
            className={`mt-3 text-slate-400 tracking-[0.3em] text-sm transition-opacity duration-700 ${
              phase >= 5 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            AEROSPACE ULTRASONIC INSPECTION
          </p>

          {/* Loading Section */}
          <div
            className={`mt-10 w-96 mx-auto transition-opacity duration-500 ${
              phase >= 5 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex justify-between text-xs text-slate-500 mb-2 font-mono">
              <span>Initializing...</span>
              <span>{Math.round(loadingProgress)}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full"
                style={{ width: `${loadingProgress}%`, transition: 'width 0.1s linear' }}
              />
            </div>
          </div>

          {/* Compliance Badges */}
          <div
            className={`mt-8 flex justify-center gap-6 transition-opacity duration-500 ${
              phase >= 6 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {['AMS-STD-2154', 'ASTM E2375', 'EN 12668', 'ISO 9712'].map((std) => (
              <div
                key={std}
                className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded border border-slate-700"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-xs text-slate-300 font-mono">{std}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - System Log */}
      <div
        className={`absolute right-0 top-16 bottom-16 w-72 bg-slate-800/60 border-l border-blue-500/20 p-4 gpu-layer transition-all duration-700 ${
          phase >= 2 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transform: phase >= 2 ? 'translateX(0) translateZ(0)' : 'translateX(100%) translateZ(0)' }}
      >
        <div className="text-[10px] text-blue-400 uppercase tracking-widest mb-4 font-medium">
          System Log
        </div>

        <div className="space-y-2 font-mono text-xs">
          {systemChecks.map((check, i) => (
            <div
              key={i}
              className="flex items-start gap-2 animate-fade-in"
            >
              <span className="text-green-400 mt-0.5">✓</span>
              <span className="text-slate-300">{check}</span>
            </div>
          ))}
          {systemChecks.length < 5 && (
            <div className="flex items-center gap-2 text-slate-500">
              <span className="animate-pulse">●</span>
              <span>Processing...</span>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className={`mt-8 space-y-3 transition-opacity duration-500 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="text-[10px] text-blue-400 uppercase tracking-widest font-medium">
            Quick Stats
          </div>
          {[
            { label: 'Probe Type', value: '70° L-Wave' },
            { label: 'Mode', value: 'Pulse-Echo' },
            { label: 'Material', value: 'Titanium 6Al-4V' },
            { label: 'Thickness', value: '25.4 mm' },
          ].map((stat) => (
            <div key={stat.label} className="flex justify-between text-xs">
              <span className="text-slate-500">{stat.label}</span>
              <span className="text-white">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-14 bg-slate-800/90 border-t border-blue-500/30 flex items-center justify-center px-8 gpu-layer transition-all duration-500 ${
          phase >= 1 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transform: phase >= 1 ? 'translateY(0) translateZ(0)' : 'translateY(100%) translateZ(0)' }}
      >
        <div className="flex items-center gap-12 text-xs text-slate-400">
          <span>Professional NDT Solutions</span>
          <span className="text-blue-500">•</span>
          <span>Precision Engineering</span>
          <span className="text-blue-500">•</span>
          <span>Quality Assurance</span>
          <span className="text-blue-500">•</span>
          <span>© 2024 Scan-Master</span>
        </div>
      </div>

      <style>{`
        .gpu-layer {
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        @keyframes radar-sweep {
          from { transform: rotate(0deg) translateZ(0); }
          to { transform: rotate(360deg) translateZ(0); }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateX(-10px) translateZ(0); }
          to { opacity: 1; transform: translateX(0) translateZ(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        @keyframes rotate-tech-ring {
          from { transform: rotate(0deg) translateZ(0); }
          to { transform: rotate(360deg) translateZ(0); }
        }

        @keyframes logo-3d-pop {
          0%, 100% { transform: translateY(0) scale(1) translateZ(0); }
          50% { transform: translateY(-12px) scale(1.08) translateZ(30px); }
        }

        @keyframes status-blink-aerospace {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default SplashOption5_AerospaceCommand;
