/**
 * OPTION 10: Quantum Field Splash Screen
 *
 * שדה קוונטי עם חלקיקים מתחברים - אפקט מדע עתידני
 */

import React, { useEffect, useState, useRef } from 'react';

const SplashOption10_QuantumField: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
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

  // Quantum field particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      connections: number[];
    }

    const particles: Particle[] = [];
    const numParticles = 80;
    const connectionDistance = 150;
    const colors = ['#00ffff', '#ff00ff', '#00ff88', '#ffff00', '#ff8800'];

    // Initialize particles
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        connections: [],
      });
    }

    let animationId: number;
    let time = 0;

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 15, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Update and draw particles
      particles.forEach((p, i) => {
        // Attract towards center with oscillation
        const dx = centerX - p.x;
        const dy = centerY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 200) {
          p.vx += dx * 0.0001;
          p.vy += dy * 0.0001;
        }

        // Add quantum wobble
        p.vx += Math.sin(time * 0.02 + i) * 0.05;
        p.vy += Math.cos(time * 0.02 + i) * 0.05;

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        p.x += p.vx;
        p.y += p.vy;

        // Boundary bounce
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const cdx = p.x - other.x;
          const cdy = p.y - other.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < connectionDistance) {
            const alpha = 1 - cdist / connectionDistance;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(0, 200, 255, ${alpha * 0.3})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Draw glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        gradient.addColorStop(0, p.color.replace(')', ', 0.5)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        ctx.fill();
      });

      time++;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#050510] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Quantum field overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(5,5,16,0.9) 100%)',
        }}
      />

      {/* Central Logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`relative transition-all duration-1000 ${
            phase >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
        >
          {/* Quantum energy field around logo */}
          <div className="absolute -inset-16">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full gpu-layer"
                style={{
                  border: `2px solid rgba(${i === 0 ? '0, 255, 255' : i === 1 ? '255, 0, 255' : '0, 255, 136'}, 0.3)`,
                  animation: `quantum-orbit ${4 + i * 2}s linear infinite`,
                  transform: `rotateX(${60 + i * 15}deg)`,
                }}
              />
            ))}
          </div>

          {/* Energy sparks */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full gpu-layer"
              style={{
                background: ['#00ffff', '#ff00ff', '#00ff88', '#ffff00'][i % 4],
                boxShadow: `0 0 10px ${['#00ffff', '#ff00ff', '#00ff88', '#ffff00'][i % 4]}`,
                animation: `quantum-spark ${2 + Math.random()}s ease-in-out ${i * 0.3}s infinite`,
                left: '50%',
                top: '50%',
              }}
            />
          ))}

          {/* Logo with 3D pop-out effect */}
          <div className="relative w-72 h-72 flex items-center justify-center">
            <div className="relative gpu-layer" style={{
              animation: 'logo-3d-pop 4s ease-in-out infinite',
              perspective: '1000px',
            }}>
              <img
                src="/sm-logo.png"
                alt="SM Logo"
                className="relative w-64 h-64 object-contain"
                style={{
                  filter: 'drop-shadow(0 12px 35px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 50px rgba(0, 255, 255, 1)) drop-shadow(0 0 80px rgba(255, 0, 255, 0.6))',
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
            background: 'linear-gradient(90deg, #00ffff, #ff00ff, #00ff88, #00ffff)',
            backgroundSize: '300% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: phase >= 4 ? 'quantum-text 4s linear infinite' : 'none',
          }}
        >
          SCAN-MASTER
        </h1>
        <p className={`mt-4 text-cyan-300/60 tracking-[0.4em] text-sm transition-opacity duration-500 ${phase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          QUANTUM PRECISION NDT
        </p>
      </div>

      {/* Quantum state indicators */}
      <div className={`absolute top-8 left-8 font-mono text-xs transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="space-y-1">
          <div className="text-cyan-400/60">FIELD: STABLE</div>
          <div className="text-magenta-400/60" style={{ color: 'rgba(255, 0, 255, 0.6)' }}>COHERENCE: 99.9%</div>
          <div className="text-green-400/60">ENTANGLEMENT: ACTIVE</div>
        </div>
      </div>

      <style>{`
        .gpu-layer {
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        @keyframes quantum-orbit {
          from { transform: rotateX(60deg) rotateZ(0deg) translateZ(0); }
          to { transform: rotateX(60deg) rotateZ(360deg) translateZ(0); }
        }

        @keyframes quantum-spark {
          0%, 100% {
            transform: translate(-50%, -50%) rotate(0deg) translateX(80px) scale(1) translateZ(0);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) rotate(180deg) translateX(80px) scale(1.5) translateZ(0);
            opacity: 1;
          }
        }

        @keyframes logo-3d-pop {
          0%, 100% { transform: translateY(0) scale(1) translateZ(0); }
          50% { transform: translateY(-18px) scale(1.1) translateZ(40px); }
        }

        @keyframes quantum-text {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
      `}</style>
    </div>
  );
};

export default SplashOption10_QuantumField;
