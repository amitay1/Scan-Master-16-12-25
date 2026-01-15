/**
 * OPTION 9: Hologram Projection Splash Screen
 *
 * הולוגרמה מוקרנת כמו בסרטי מדע בדיוני - אפקט עתידני מרהיב
 */

import React, { useEffect, useState, useRef } from 'react';

const SplashOption9_HologramProjection: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 3000),
      setTimeout(() => setPhase(5), 4000),
      setTimeout(() => onComplete?.(), 5500),
    ];

    // Scan progress
    const scanInterval = setInterval(() => {
      setScanProgress((prev) => Math.min(prev + 2, 100));
    }, 50);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(scanInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#0a0a12] overflow-hidden">
      {/* Floor grid perspective */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/2"
        style={{
          background: `
            linear-gradient(to top, rgba(0, 150, 255, 0.1), transparent),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 49px,
              rgba(0, 150, 255, 0.15) 49px,
              rgba(0, 150, 255, 0.15) 50px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 49px,
              rgba(0, 150, 255, 0.15) 49px,
              rgba(0, 150, 255, 0.15) 50px
            )
          `,
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom center',
        }}
      />

      {/* Projector base */}
      <div
        className={`absolute bottom-10 left-1/2 -translate-x-1/2 transition-all duration-1000 ${
          phase >= 1 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="relative">
          {/* Base platform */}
          <div
            className="w-40 h-8 rounded-full"
            style={{
              background: 'linear-gradient(to bottom, #1a1a2e, #0a0a15)',
              boxShadow: '0 0 30px rgba(0, 150, 255, 0.3), inset 0 2px 10px rgba(255,255,255,0.1)',
            }}
          />
          {/* Projection beam */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 bottom-full transition-all duration-1000 ${
              phase >= 2 ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              width: '4px',
              height: '400px',
              background: 'linear-gradient(to top, rgba(0, 150, 255, 0.8), rgba(0, 150, 255, 0.2), transparent)',
              boxShadow: '0 0 20px rgba(0, 150, 255, 0.5)',
            }}
          />
        </div>
      </div>

      {/* Hologram container */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: '-100px' }}>
        <div
          className={`relative transition-all duration-1500 ${
            phase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
        >
          {/* Hologram distortion lines */}
          <div
            className="absolute -inset-20 gpu-layer"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 3px,
                rgba(0, 200, 255, 0.03) 3px,
                rgba(0, 200, 255, 0.03) 4px
              )`,
              animation: 'holo-scan 2s linear infinite',
            }}
          />

          {/* Rotating hologram rings */}
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border gpu-layer"
              style={{
                width: `${180 + i * 40}px`,
                height: `${180 + i * 40}px`,
                borderColor: `rgba(0, 200, 255, ${0.4 - i * 0.08})`,
                animation: `holo-ring ${4 + i}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
                boxShadow: `0 0 15px rgba(0, 200, 255, ${0.2 - i * 0.03})`,
              }}
            />
          ))}

          {/* Hologram content */}
          <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Triangular data points */}
            <svg className="absolute inset-0 w-full h-full gpu-layer" viewBox="0 0 200 200" style={{ animation: 'holo-rotate 20s linear infinite' }}>
              {[0, 120, 240].map((angle) => (
                <g key={angle} transform={`rotate(${angle} 100 100)`}>
                  <circle cx="100" cy="30" r="4" fill="rgba(0, 255, 255, 0.8)" />
                  <line x1="100" y1="30" x2="100" y2="100" stroke="rgba(0, 255, 255, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
                </g>
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
                  filter: 'drop-shadow(0 12px 35px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 50px rgba(0, 255, 255, 1))',
                  transform: 'translateZ(50px)',
                }}
              />

              {/* Data overlay */}
              <div className="absolute -right-20 top-0 text-[8px] font-mono text-cyan-400/50">
                <div>ID: SM-7734</div>
                <div>TYPE: NDT</div>
                <div>STATUS: ACTIVE</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HUD Interface */}
      <div className={`absolute top-8 left-8 transition-opacity duration-500 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-black/30 border border-cyan-500/30 rounded p-4 backdrop-blur-sm">
          <div className="text-cyan-400 text-xs font-mono mb-2">HOLOGRAM PROJECTION</div>
          <div className="w-48 h-2 bg-slate-800 rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-100"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <div className="text-cyan-400/60 text-[10px] mt-1 font-mono">
            RENDER: {scanProgress}%
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center">
        <h1
          className={`text-5xl font-black tracking-wider transition-all duration-1000 ${
            phase >= 4 ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            color: 'rgba(0, 255, 255, 0.9)',
            textShadow: '0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 150, 255, 0.3)',
            animation: phase >= 4 ? 'holo-text 3s ease-in-out infinite' : 'none',
          }}
        >
          SCAN-MASTER
        </h1>
        <p className={`mt-4 text-cyan-300/60 tracking-[0.4em] text-sm font-mono transition-opacity duration-500 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          HOLOGRAPHIC INTERFACE
        </p>
      </div>

      <style>{`
        .gpu-layer {
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        @keyframes holo-scan {
          from { transform: translateY(-100%) translateZ(0); }
          to { transform: translateY(100%) translateZ(0); }
        }

        @keyframes holo-ring {
          from { transform: translate(-50%, -50%) rotateX(75deg) rotateZ(0deg) translateZ(0); }
          to { transform: translate(-50%, -50%) rotateX(75deg) rotateZ(360deg) translateZ(0); }
        }

        @keyframes holo-rotate {
          from { transform: rotate(0deg) translateZ(0); }
          to { transform: rotate(360deg) translateZ(0); }
        }

        @keyframes logo-3d-pop {
          0%, 100% { transform: translateY(0) scale(1) translateZ(0); }
          50% { transform: translateY(-18px) scale(1.1) translateZ(40px); }
        }

        @keyframes holo-text {
          0%, 100% { opacity: 0.9; text-shadow: 0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 150, 255, 0.3); }
          50% { opacity: 1; text-shadow: 0 0 30px rgba(0, 255, 255, 0.8), 0 0 60px rgba(0, 150, 255, 0.5); }
        }
      `}</style>
    </div>
  );
};

export default SplashOption9_HologramProjection;
