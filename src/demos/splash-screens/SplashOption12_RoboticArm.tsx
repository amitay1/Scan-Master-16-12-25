/**
 * OPTION 12: Robotic Arm Scanner Splash Screen
 *
 * זרוע רובוטית 6 צירים עם גשש אולטרסוני סורקת חלק - תצוגה תעשייתית
 */

import React, { useEffect, useState, useRef } from 'react';

const SplashOption12_RoboticArm: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [armAngle, setArmAngle] = useState(-30);
  const [scanLine, setScanLine] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 3000),
      setTimeout(() => setPhase(5), 4200),
      setTimeout(() => onComplete?.(), 5500),
    ];

    // Arm scanning motion
    let direction = 1;
    const armInterval = setInterval(() => {
      setArmAngle((prev) => {
        if (prev >= 30) direction = -1;
        if (prev <= -30) direction = 1;
        return prev + direction * 0.8;
      });
      setScanLine((prev) => (prev + 2) % 100);
    }, 30);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(armInterval);
    };
  }, [onComplete]);

  // Scan beam visualization
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (phase >= 3) {
        const centerX = canvas.width / 2;
        const probeX = centerX + Math.sin((armAngle * Math.PI) / 180) * 100;
        const probeY = canvas.height * 0.45;
        const partY = canvas.height * 0.65;

        // Draw scan beam
        ctx.beginPath();
        ctx.moveTo(probeX, probeY);
        ctx.lineTo(probeX - 30, partY);
        ctx.lineTo(probeX + 30, partY);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(probeX, probeY, probeX, partY);
        gradient.addColorStop(0, 'rgba(0, 200, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(0, 200, 255, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Scan waves
        for (let i = 0; i < 4; i++) {
          const waveY = probeY + ((time * 3 + i * 40) % (partY - probeY));
          const waveWidth = 10 + (waveY - probeY) * 0.3;

          ctx.beginPath();
          ctx.moveTo(probeX - waveWidth, waveY);
          ctx.lineTo(probeX + waveWidth, waveY);
          ctx.strokeStyle = `rgba(0, 255, 255, ${0.8 - (waveY - probeY) / (partY - probeY) * 0.7})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Echo signal returning
        for (let i = 0; i < 2; i++) {
          const echoY = partY - ((time * 2 + i * 60) % (partY - probeY));
          if (echoY > probeY) {
            const echoWidth = 5 + (partY - echoY) * 0.15;
            ctx.beginPath();
            ctx.arc(probeX, echoY, echoWidth, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 100, ${0.6 - (partY - echoY) / (partY - probeY) * 0.5})`;
            ctx.fill();
          }
        }
      }

      time++;
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [phase, armAngle]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />

      {/* Grid floor */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3"
        style={{
          background: `
            linear-gradient(to top, rgba(0, 100, 150, 0.1), transparent),
            repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(0, 150, 200, 0.1) 49px, rgba(0, 150, 200, 0.1) 50px),
            repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(0, 150, 200, 0.1) 49px, rgba(0, 150, 200, 0.1) 50px)
          `,
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom center',
        }}
      />

      {/* Robot base */}
      <div className={`absolute bottom-[25%] left-1/2 -translate-x-1/2 transition-all duration-500 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
        {/* Base cylinder */}
        <div
          className="w-24 h-12 rounded-full"
          style={{
            background: 'linear-gradient(180deg, #ff6b00 0%, #cc5500 50%, #994400 100%)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        />

        {/* Robot arm assembly */}
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 origin-bottom transition-transform duration-100"
          style={{ transform: `translateX(-50%) rotate(${armAngle * 0.3}deg)` }}
        >
          {/* Lower arm */}
          <div
            className="w-8 h-32 rounded-lg origin-bottom"
            style={{
              background: 'linear-gradient(90deg, #ff7b00, #ff9500, #ff7b00)',
              boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.3)',
            }}
          >
            {/* Joint */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-6 bg-slate-700 rounded-full" />

            {/* Upper arm */}
            <div
              className="absolute -top-6 left-1/2 origin-bottom transition-transform duration-100"
              style={{ transform: `translateX(-50%) rotate(${armAngle * 0.5}deg)` }}
            >
              <div
                className="w-6 h-28 rounded-lg"
                style={{
                  background: 'linear-gradient(90deg, #ff7b00, #ff9500, #ff7b00)',
                }}
              >
                {/* Wrist joint */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-slate-600 rounded-full" />

                {/* Probe holder */}
                <div
                  className={`absolute -top-12 left-1/2 -translate-x-1/2 transition-all duration-500 ${
                    phase >= 2 ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ transform: `translateX(-50%) rotate(${-armAngle * 0.8}deg)` }}
                >
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                    {/* Probe */}
                    <div className="w-6 h-14 bg-gradient-to-b from-slate-500 to-slate-700 rounded-b-full relative">
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-cyan-400 rounded-full" />
                      {/* Active indicator */}
                      <div
                        className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full transition-opacity ${
                          phase >= 3 ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{
                          background: 'radial-gradient(circle, rgba(0,200,255,0.6) 0%, transparent 70%)',
                          animation: 'probe-active 0.5s ease-in-out infinite',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test part */}
      <div className={`absolute bottom-[12%] left-1/2 -translate-x-1/2 transition-all duration-700 ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div
          className="w-64 h-16 rounded-lg relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #7a8a9a 0%, #5a6a7a 50%, #4a5a6a 100%)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          {/* Scan line indicator on part */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-cyan-400/50 transition-all duration-100"
            style={{
              left: `${scanLine}%`,
              boxShadow: '0 0 10px rgba(0,200,255,0.8)',
            }}
          />
        </div>
        {/* Platform */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-72 h-4 bg-slate-600 rounded" />
      </div>

      {/* Logo */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
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
                filter: 'drop-shadow(0 12px 35px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 50px rgba(255, 120, 0, 1))',
                transform: 'translateZ(50px)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center z-20">
        <h1
          className={`text-4xl font-black tracking-wider transition-all duration-700 ${
            phase >= 5 ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(90deg, #ff7b00, #ffaa00, #ff7b00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          SCAN-MASTER
        </h1>
        <p className={`mt-2 text-orange-400/60 tracking-[0.3em] text-xs transition-opacity duration-500 ${phase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
          ROBOTIC UT INSPECTION
        </p>
      </div>

      {/* Scan progress */}
      <div className={`absolute top-8 left-8 transition-opacity duration-500 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-slate-800/80 backdrop-blur rounded-lg p-4 border border-orange-500/30">
          <div className="text-xs font-mono text-slate-400 mb-2">SCAN PROGRESS</div>
          <div className="w-48 h-2 bg-slate-700 rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-500"
              style={{ width: `${scanLine}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-mono">
            <span className="text-cyan-400">X: {(armAngle + 30).toFixed(1)}mm</span>
            <span className="text-green-400">ACTIVE</span>
          </div>
        </div>
      </div>

      <style>{`
        .gpu-layer {
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        @keyframes probe-active {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.6; }
          50% { transform: translateX(-50%) scale(1.2); opacity: 0.8; }
        }

        @keyframes logo-3d-pop {
          0%, 100% { transform: translateY(0) scale(1) translateZ(0); }
          50% { transform: translateY(-18px) scale(1.1) translateZ(40px); }
        }
      `}</style>
    </div>
  );
};

export default SplashOption12_RoboticArm;
