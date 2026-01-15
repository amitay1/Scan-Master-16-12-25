/**
 * OPTION 13: C-Scan Reveal Splash Screen
 *
 * תמונת C-Scan נבנית בזמן אמת - הלוגו מתגלה מתוך נתוני הסריקה
 */

import React, { useEffect, useState, useRef } from 'react';

const SplashOption13_CScanReveal: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [scanY, setScanY] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanDataRef = useRef<number[][]>([]);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 3500),
      setTimeout(() => setPhase(5), 4500),
      setTimeout(() => onComplete?.(), 5500),
    ];

    // Scan line progress
    const scanInterval = setInterval(() => {
      setScanY((prev) => Math.min(prev + 0.8, 100));
    }, 25);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(scanInterval);
    };
  }, [onComplete]);

  // C-Scan visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = Math.min(window.innerWidth * 0.5, 400);
    canvas.width = size;
    canvas.height = size;

    // Initialize scan data if empty
    if (scanDataRef.current.length === 0) {
      const rows = 100;
      const cols = 100;
      for (let y = 0; y < rows; y++) {
        scanDataRef.current[y] = [];
        for (let x = 0; x < cols; x++) {
          // Create a pattern that reveals the logo shape
          const centerX = cols / 2;
          const centerY = rows / 2;
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Logo-like circular pattern with some variation
          let value = 0.2 + Math.random() * 0.1; // Base noise

          // Create SM-like shapes
          if (dist < 30) {
            value = 0.7 + Math.random() * 0.2;
          }
          if (dist > 20 && dist < 35 && Math.abs(dy) < 15) {
            value = 0.85 + Math.random() * 0.15;
          }

          // Add some defect-like indications
          if ((x === 25 && y > 40 && y < 60) || (x === 75 && y > 30 && y < 50)) {
            value = 0.1 + Math.random() * 0.1;
          }

          scanDataRef.current[y][x] = value;
        }
      }
    }

    let animationId: number;

    const draw = () => {
      ctx.fillStyle = '#0a1020';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const data = scanDataRef.current;
      const rows = data.length;
      const cols = data[0]?.length || 0;
      const cellW = canvas.width / cols;
      const cellH = canvas.height / rows;
      const currentRow = Math.floor((scanY / 100) * rows);

      // Draw scanned area
      for (let y = 0; y <= currentRow && y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const value = data[y][x];

          // Color based on amplitude (typical C-Scan colors)
          let r, g, b;
          if (value < 0.2) {
            // Low amplitude - blue (possible defect)
            r = 0;
            g = 50 + value * 200;
            b = 200 + value * 55;
          } else if (value < 0.5) {
            // Medium - green/yellow
            r = value * 200;
            g = 150 + value * 100;
            b = 50;
          } else if (value < 0.8) {
            // High - orange
            r = 200 + value * 55;
            g = 100 + value * 50;
            b = 0;
          } else {
            // Very high - red (back wall)
            r = 255;
            g = 50 + (1 - value) * 100;
            b = 0;
          }

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
        }
      }

      // Draw scan line
      if (currentRow < rows) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(0, currentRow * cellH, canvas.width, 2);

        // Glow effect
        const gradient = ctx.createLinearGradient(0, (currentRow - 5) * cellH, 0, (currentRow + 5) * cellH);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.3)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, (currentRow - 5) * cellH, canvas.width, 10 * cellH);
      }

      // Grid overlay
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.1)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 10; i++) {
        const pos = (i / 10) * canvas.width;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [scanY]);

  return (
    <div className="fixed inset-0 bg-slate-900 overflow-hidden">
      {/* Scan monitor frame */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`relative transition-all duration-500 ${phase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          {/* Monitor bezel */}
          <div
            className="absolute -inset-6 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #2a3040 0%, #1a2030 50%, #0a1020 100%)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)',
            }}
          />

          {/* Screen border glow */}
          <div
            className="absolute -inset-1 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(0,200,255,0.3), rgba(0,100,200,0.1))',
            }}
          />

          {/* C-Scan canvas */}
          <canvas
            ref={canvasRef}
            className="relative rounded-lg"
            style={{
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
            }}
          />

          {/* Scan info overlay */}
          <div className="absolute top-2 left-2 text-[10px] font-mono text-cyan-400/70">
            <div>C-SCAN VIEW</div>
            <div className="text-green-400">AMPLITUDE</div>
          </div>

          <div className="absolute top-2 right-2 text-[10px] font-mono text-right">
            <div className="text-cyan-400/70">Y: {scanY.toFixed(1)}%</div>
            <div className="text-slate-400">200x200mm</div>
          </div>

          {/* Color scale */}
          <div className="absolute -right-12 top-0 bottom-0 w-6 flex flex-col rounded overflow-hidden">
            <div className="flex-1 bg-gradient-to-b from-red-500 via-orange-500 via-yellow-500 via-green-500 to-blue-500" />
            <div className="absolute top-1 right-8 text-[8px] text-slate-400">100%</div>
            <div className="absolute bottom-1 right-8 text-[8px] text-slate-400">0%</div>
          </div>
        </div>
      </div>

      {/* Logo appears after scan */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`relative transition-all duration-1000 ${
            phase >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
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
            background: 'linear-gradient(90deg, #00ff88, #00ddff, #00ff88)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          SCAN-MASTER
        </h1>
        <p className={`mt-2 text-cyan-400/60 tracking-[0.3em] text-xs transition-opacity duration-500 ${phase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
          C-SCAN IMAGING SYSTEMS
        </p>
      </div>

      {/* Status bar */}
      <div className={`absolute bottom-32 left-1/2 -translate-x-1/2 transition-opacity duration-500 ${phase >= 2 ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-4 bg-slate-800/80 backdrop-blur rounded-lg px-6 py-3 border border-slate-600">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${scanY < 100 ? 'bg-green-400 animate-pulse' : 'bg-cyan-400'}`} />
            <span className="text-xs font-mono text-slate-300">
              {scanY < 100 ? 'SCANNING...' : 'COMPLETE'}
            </span>
          </div>
          <div className="w-32 h-1.5 bg-slate-700 rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-100"
              style={{ width: `${scanY}%` }}
            />
          </div>
          <span className="text-xs font-mono text-cyan-400">{Math.round(scanY)}%</span>
        </div>
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

export default SplashOption13_CScanReveal;
