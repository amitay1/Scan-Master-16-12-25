/**
 * OPTION 7: Portal/Wormhole Splash Screen
 *
 * הלוגו צץ מתוך פורטל/חור תולעת מסתחרר - אפקט חלל מדהים
 */

import React, { useEffect, useState, useRef } from 'react';

const SplashOption7_PortalWormhole: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => setPhase(4), 3200),
      setTimeout(() => setPhase(5), 4000),
      setTimeout(() => onComplete?.(), 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Wormhole tunnel effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationId: number;
    let time = 0;

    const rings: { z: number; angle: number }[] = [];
    for (let i = 0; i < 30; i++) {
      rings.push({ z: i * 50, angle: Math.random() * Math.PI * 2 });
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 10, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw wormhole rings
      rings.forEach((ring, i) => {
        ring.z -= 5;
        if (ring.z < 0) ring.z = 1500;

        const scale = 1000 / (ring.z + 100);
        const radius = 300 * scale;
        const alpha = Math.max(0, 1 - ring.z / 1500);

        ring.angle += 0.02;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(ring.angle);

        // Outer glow
        const gradient = ctx.createRadialGradient(0, 0, radius * 0.8, 0, 0, radius);
        gradient.addColorStop(0, `rgba(100, 0, 255, ${alpha * 0.3})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Ring
        ctx.strokeStyle = `rgba(0, 200, 255, ${alpha})`;
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Energy sparks
        for (let j = 0; j < 8; j++) {
          const sparkAngle = (j / 8) * Math.PI * 2 + time * 0.05;
          const sparkX = Math.cos(sparkAngle) * radius;
          const sparkY = Math.sin(sparkAngle) * radius;

          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, 3 * scale, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      time++;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#000010] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Central Portal */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Portal rings */}
        <div className={`absolute transition-all duration-1000 ${phase >= 2 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 gpu-layer"
              style={{
                width: `${200 + i * 60}px`,
                height: `${200 + i * 60}px`,
                borderColor: `rgba(100, 0, 255, ${0.6 - i * 0.1})`,
                animation: `portal-ring ${3 + i * 0.5}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
                boxShadow: `0 0 20px rgba(100, 0, 255, ${0.3 - i * 0.05}), inset 0 0 20px rgba(100, 0, 255, ${0.2 - i * 0.03})`,
              }}
            />
          ))}
        </div>

        {/* Energy field */}
        <div
          className={`absolute w-80 h-80 rounded-full transition-all duration-1000 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}
          style={{
            background: 'conic-gradient(from 0deg, transparent, rgba(100, 0, 255, 0.3), transparent, rgba(0, 200, 255, 0.3), transparent)',
            animation: 'portal-spin 2s linear infinite',
            filter: 'blur(20px)',
          }}
        />

        {/* Logo emerging from portal */}
        <div
          className={`relative z-10 transition-all duration-1500 ${
            phase >= 3 ? 'scale-100 opacity-100' : 'scale-[3] opacity-0'
          }`}
          style={{
            filter: phase >= 3 ? 'none' : 'blur(20px)',
          }}
        >
          {/* Portal glow behind logo */}
          <div
            className="absolute -inset-10 rounded-full gpu-layer"
            style={{
              background: 'radial-gradient(circle, rgba(100, 0, 255, 0.5) 0%, rgba(0, 200, 255, 0.3) 50%, transparent 70%)',
              animation: 'portal-glow 2s ease-in-out infinite',
            }}
          />

          {/* Spinning energy around logo */}
          <div
            className="absolute -inset-8 gpu-layer"
            style={{ animation: 'portal-energy 4s linear infinite' }}
          >
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: i % 2 === 0 ? '#6400ff' : '#00c8ff',
                  boxShadow: `0 0 10px ${i % 2 === 0 ? '#6400ff' : '#00c8ff'}`,
                  left: '50%',
                  top: '50%',
                  transform: `rotate(${i * 30}deg) translateY(-60px)`,
                }}
              />
            ))}
          </div>

          {/* Logo with 3D pop-out effect */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="relative gpu-layer" style={{
              animation: 'logo-3d-pop 4s ease-in-out infinite',
              perspective: '1000px',
            }}>
              <img
                src="/sm-logo.png"
                alt="SM Logo"
                className="relative w-56 h-56 object-contain"
                style={{
                  filter: 'drop-shadow(0 12px 35px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 50px rgba(100, 0, 255, 1))',
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
            phase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          style={{
            background: 'linear-gradient(135deg, #ffffff, #c8a0ff, #00c8ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(100, 0, 255, 0.5)',
          }}
        >
          SCAN-MASTER
        </h1>
        <p className={`mt-4 text-purple-300/70 tracking-[0.4em] text-sm transition-opacity duration-700 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          DIMENSIONAL INSPECTION TECHNOLOGY
        </p>
      </div>

      {/* HUD elements */}
      <div className={`absolute top-8 right-8 text-right font-mono text-xs text-purple-400/60 transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <div>PORTAL: STABLE</div>
        <div>DIMENSION: PRIMARY</div>
        <div className="text-cyan-400">SYNC: 100%</div>
      </div>

      <style>{`
        .gpu-layer {
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        @keyframes portal-ring {
          from { transform: translate(-50%, -50%) rotate(0deg) translateZ(0); }
          to { transform: translate(-50%, -50%) rotate(360deg) translateZ(0); }
        }

        @keyframes portal-spin {
          from { transform: rotate(0deg) translateZ(0); }
          to { transform: rotate(360deg) translateZ(0); }
        }

        @keyframes portal-glow {
          0%, 100% { transform: scale(1) translateZ(0); opacity: 0.5; }
          50% { transform: scale(1.2) translateZ(0); opacity: 0.8; }
        }

        @keyframes portal-energy {
          from { transform: rotate(0deg) translateZ(0); }
          to { transform: rotate(360deg) translateZ(0); }
        }

        @keyframes logo-3d-pop {
          0%, 100% { transform: translateY(0) scale(1) translateZ(0); }
          50% { transform: translateY(-18px) scale(1.1) translateZ(40px); }
        }
      `}</style>
    </div>
  );
};

export default SplashOption7_PortalWormhole;
