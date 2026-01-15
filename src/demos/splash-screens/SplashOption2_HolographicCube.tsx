/**
 * OPTION 2: Holographic 3D Cube Splash Screen - HARMONIOUS FLOW VERSION
 *
 * The logo emerges from within the cube's core, creating seamless transition
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';

const SplashOption2_HolographicCube: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const particlesRef = useRef<HTMLDivElement>(null);

  // Memoize stars to prevent re-renders
  const stars = useMemo(() =>
    [...Array(80)].map((_, i) => ({
      key: i,
      width: `${1 + Math.random() * 2}px`,
      height: `${1 + Math.random() * 2}px`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      opacity: Math.random() * 0.8 + 0.2,
      delay: `${Math.random() * 2}s`,
      duration: `${2 + Math.random() * 3}s`,
    }))
  , []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),      // Cube appears
      setTimeout(() => setPhase(2), 1000),     // Logo starts glowing inside
      setTimeout(() => setPhase(3), 2000),     // Cube transforms, logo grows
      setTimeout(() => setPhase(4), 3000),     // Cube dissolves, logo full
      setTimeout(() => setPhase(5), 3800),     // Rings form
      setTimeout(() => setPhase(6), 4500),     // Text appears
      setTimeout(() => onComplete?.(), 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Generate particles on cube transformation
  useEffect(() => {
    if (phase === 3 && particlesRef.current) {
      const container = particlesRef.current;
      container.innerHTML = '';

      for (let i = 0; i < 60; i++) {
        const particle = document.createElement('div');
        const angle = (i / 60) * Math.PI * 2;
        const distance = 150 + Math.random() * 150;
        const delay = Math.random() * 0.5;

        particle.className = 'particle';
        particle.style.cssText = `
          position: absolute;
          width: ${3 + Math.random() * 5}px;
          height: ${3 + Math.random() * 5}px;
          background: linear-gradient(135deg, #00ffff, #0088ff);
          border-radius: 50%;
          left: 50%;
          top: 50%;
          opacity: 0;
          transform: translate(-50%, -50%) translateZ(0);
          will-change: transform, opacity;
          animation: particle-fly 2s ease-out ${delay}s forwards;
          --tx: ${Math.cos(angle) * distance}px;
          --ty: ${Math.sin(angle) * distance}px;
        `;
        container.appendChild(particle);
      }
    }
  }, [phase]);

  // Calculate cube scale and opacity based on phase
  const getCubeStyle = () => {
    if (phase < 1) return { scale: 0, opacity: 0, rotation: 0 };
    if (phase < 3) return { scale: 1, opacity: 1, rotation: 0 };
    if (phase < 4) return { scale: 1.2, opacity: 0.6, rotation: 0 }; // Expanding
    return { scale: 1.5, opacity: 0, rotation: 0 }; // Dissolving
  };

  const cubeStyle = getCubeStyle();

  // Logo scale progression
  const getLogoScale = () => {
    if (phase < 2) return 0;
    if (phase < 3) return 0.3;  // Small, inside cube
    if (phase < 4) return 0.6;  // Growing
    if (phase < 5) return 0.85; // Almost full
    return 1; // Full size
  };

  const getLogoOpacity = () => {
    if (phase < 2) return 0;
    if (phase < 3) return 0.5;
    if (phase < 4) return 0.8;
    return 1;
  };

  return (
    <div className="fixed inset-0 bg-[#020510] flex items-center justify-center overflow-hidden">
      {/* Deep Space Background */}
      <div className="absolute inset-0">
        {/* Nebula effect */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(ellipse at 20% 80%, rgba(0, 100, 255, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(100, 0, 255, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(0, 50, 100, 0.4) 0%, transparent 70%)
            `,
          }}
        />

        {/* Stars */}
        {stars.map((star) => (
          <div
            key={star.key}
            className="absolute rounded-full bg-white gpu-layer"
            style={{
              width: star.width,
              height: star.height,
              left: star.left,
              top: star.top,
              opacity: star.opacity,
              animation: `twinkle ${star.duration} ease-in-out ${star.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* Holographic Floor */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1/2 transition-opacity duration-1000 gpu-layer ${
          phase >= 1 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'linear-gradient(to top, rgba(0, 150, 255, 0.1) 0%, transparent 100%)',
          transform: 'perspective(1000px) rotateX(75deg) translateZ(0)',
          transformOrigin: 'bottom center',
        }}
      >
        <div className="absolute inset-0 gpu-layer" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 200, 255, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 200, 255, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-scroll 2s linear infinite',
        }} />
      </div>

      {/* Main Stage - Contains both cube and logo for unified animation */}
      <div className="relative flex items-center justify-center" style={{ width: '400px', height: '400px' }}>

        {/* 3D Cube */}
        <div
          className="absolute gpu-layer"
          style={{
            transformStyle: 'preserve-3d',
            transform: `scale(${cubeStyle.scale})`,
            opacity: cubeStyle.opacity,
            transition: 'transform 1s ease-out, opacity 1s ease-out',
            animation: phase >= 1 && phase < 4 ? 'cube-rotate 6s linear infinite' : 'none',
          }}
        >
          {/* Cube faces */}
          {[
            { transform: 'translateZ(80px)' },
            { transform: 'translateZ(-80px) rotateY(180deg)' },
            { transform: 'translateX(-80px) rotateY(-90deg)' },
            { transform: 'translateX(80px) rotateY(90deg)' },
            { transform: 'translateY(-80px) rotateX(90deg)' },
            { transform: 'translateY(80px) rotateX(-90deg)' },
          ].map((face, i) => (
            <div
              key={i}
              className="absolute w-40 h-40 -ml-20 -mt-20 gpu-layer"
              style={{
                transform: face.transform,
                background: `linear-gradient(135deg,
                  rgba(0, 150, 255, ${phase >= 3 ? 0.05 : 0.1}) 0%,
                  rgba(0, 255, 255, ${phase >= 3 ? 0.02 : 0.05}) 100%)`,
                border: `2px solid rgba(0, 255, 255, ${phase >= 3 ? 0.2 : 0.5})`,
                backfaceVisibility: 'hidden',
                transition: 'all 0.8s ease-out',
              }}
            >
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <path d="M0 20 L0 0 L20 0" fill="none" stroke="rgba(0, 255, 255, 0.8)" strokeWidth="2" />
                <path d="M100 20 L100 0 L80 0" fill="none" stroke="rgba(0, 255, 255, 0.8)" strokeWidth="2" />
                <path d="M0 80 L0 100 L20 100" fill="none" stroke="rgba(0, 255, 255, 0.8)" strokeWidth="2" />
                <path d="M100 80 L100 100 L80 100" fill="none" stroke="rgba(0, 255, 255, 0.8)" strokeWidth="2" />
              </svg>
            </div>
          ))}

          {/* Inner glowing core - contains the logo energy */}
          <div
            className="absolute w-32 h-32 -ml-16 -mt-16 rounded-full gpu-layer"
            style={{
              background: `radial-gradient(circle,
                rgba(0, 255, 255, ${phase >= 2 ? 1 : 0.8}) 0%,
                rgba(0, 100, 255, ${phase >= 2 ? 0.6 : 0.4}) 50%,
                transparent 70%)`,
              animation: 'core-pulse 2s ease-in-out infinite',
              transform: `scale(${phase >= 3 ? 1.5 : 1})`,
              transition: 'transform 1s ease-out',
            }}
          />
        </div>

        {/* Particles container */}
        <div ref={particlesRef} className="absolute inset-0 pointer-events-none" />

        {/* Energy rings - appear during transition */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            opacity: phase >= 3 ? 1 : 0,
            transition: 'opacity 0.8s ease-out',
          }}
        >
          {/* Outer energy ring */}
          <div
            className="absolute rounded-full gpu-layer"
            style={{
              width: phase >= 5 ? '380px' : '200px',
              height: phase >= 5 ? '380px' : '200px',
              border: '2px dashed rgba(0, 255, 255, 0.4)',
              animation: 'rotate-ring 8s linear infinite',
              transition: 'width 1s ease-out, height 1s ease-out',
            }}
          />
          {/* Second ring */}
          <div
            className="absolute rounded-full border-2 border-cyan-500/40 gpu-layer"
            style={{
              width: phase >= 5 ? '340px' : '180px',
              height: phase >= 5 ? '340px' : '180px',
              animation: 'rotate-ring 6s linear infinite reverse',
              transition: 'width 1s ease-out, height 1s ease-out',
            }}
          />
          {/* Third ring with dots */}
          <div
            className="absolute rounded-full border border-blue-400/50 gpu-layer"
            style={{
              width: phase >= 5 ? '300px' : '160px',
              height: phase >= 5 ? '300px' : '160px',
              animation: 'rotate-ring 4s linear infinite',
              transition: 'width 1s ease-out, height 1s ease-out',
            }}
          >
            {phase >= 5 && [...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 45}deg) translateY(-148px)`,
                  animation: 'dot-fade-in 0.5s ease-out forwards',
                  animationDelay: `${i * 0.05}s`,
                  opacity: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Logo - emerges from cube core */}
        <div
          className="absolute z-20 gpu-layer"
          style={{
            transform: `scale(${getLogoScale()})`,
            opacity: getLogoOpacity(),
            transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.6s ease-out',
          }}
        >
          <div
            className="relative gpu-layer"
            style={{
              animation: phase >= 4 ? 'logo-3d-pop 4s ease-in-out infinite' : 'logo-emerge 2s ease-out',
              perspective: '1000px',
            }}
          >
            {/* Glow behind logo */}
            <div
              className="absolute inset-0 rounded-full gpu-layer"
              style={{
                width: '280px',
                height: '280px',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(0, 150, 255, 0.6) 0%, rgba(0, 100, 255, 0.3) 40%, transparent 70%)',
                filter: 'blur(20px)',
                animation: 'glow-pulse 2s ease-in-out infinite',
              }}
            />

            {/* Main logo */}
            <img
              src="/sm-logo.png"
              alt="SM Logo"
              className="w-56 h-56 object-contain relative z-10"
              style={{
                filter: `
                  drop-shadow(0 15px 40px rgba(0, 0, 0, 0.9))
                  drop-shadow(0 0 ${phase >= 4 ? '60px' : '30px'} rgba(0, 150, 255, ${phase >= 4 ? 1 : 0.6}))
                `,
                transform: 'translateZ(60px)',
                transition: 'filter 0.8s ease-out',
              }}
            />
          </div>
        </div>
      </div>

      {/* Text - appears after logo is fully revealed */}
      <div
        className={`absolute bottom-32 left-1/2 -translate-x-1/2 text-center z-20 transition-all duration-700 ${
          phase >= 6 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h1 className="text-5xl font-black tracking-wider">
          <span
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #00d4ff 40%, #0066ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            SCAN-MASTER
          </span>
        </h1>

        <p className="mt-4 text-cyan-400/70 tracking-[0.4em] text-sm uppercase">
          Next Generation NDT Platform
        </p>
      </div>

      {/* Loading indicator */}
      <div
        className={`absolute bottom-12 left-1/2 -translate-x-1/2 transition-opacity duration-500 ${
          phase >= 6 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-cyan-400 gpu-layer"
              style={{
                animation: `dot-bounce 1.4s ease-in-out ${i * 0.1}s infinite`,
              }}
            />
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-cyan-500/50 font-mono">
          QUANTUM INITIALIZATION
        </p>
      </div>

      {/* HUD corners */}
      <svg className={`absolute top-4 left-4 w-24 h-24 transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <path d="M0 40 L0 0 L40 0" fill="none" stroke="rgba(0, 255, 255, 0.4)" strokeWidth="2" />
      </svg>
      <svg className={`absolute top-4 right-4 w-24 h-24 transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <path d="M96 40 L96 0 L56 0" fill="none" stroke="rgba(0, 255, 255, 0.4)" strokeWidth="2" />
      </svg>
      <svg className={`absolute bottom-4 left-4 w-24 h-24 transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <path d="M0 56 L0 96 L40 96" fill="none" stroke="rgba(0, 255, 255, 0.4)" strokeWidth="2" />
      </svg>
      <svg className={`absolute bottom-4 right-4 w-24 h-24 transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <path d="M96 56 L96 96 L56 96" fill="none" stroke="rgba(0, 255, 255, 0.4)" strokeWidth="2" />
      </svg>

      <style>{`
        .gpu-layer {
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        @keyframes cube-rotate {
          0% { transform: rotateX(0deg) rotateY(0deg) translateZ(0); }
          100% { transform: rotateX(360deg) rotateY(360deg) translateZ(0); }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        @keyframes core-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        @keyframes grid-scroll {
          0% { transform: translateY(0) translateZ(0); }
          100% { transform: translateY(50px) translateZ(0); }
        }

        @keyframes rotate-ring {
          from { transform: rotate(0deg) translateZ(0); }
          to { transform: rotate(360deg) translateZ(0); }
        }

        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0.6) translateZ(0); opacity: 0.4; }
          40% { transform: scale(1) translateZ(0); opacity: 1; }
        }

        @keyframes dot-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes glow-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.9; }
        }

        @keyframes logo-emerge {
          0% { transform: scale(0.8) translateZ(0); }
          100% { transform: scale(1) translateZ(0); }
        }

        @keyframes logo-3d-pop {
          0%, 100% { transform: translateY(0) scale(1) translateZ(0); }
          50% { transform: translateY(-20px) scale(1.08) translateZ(40px); }
        }

        @keyframes particle-fly {
          0% {
            transform: translate(-50%, -50%) translateZ(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) translateZ(0) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SplashOption2_HolographicCube;
