import { useEffect, useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import smLogo from "@/assets/sm-logo.png";
import "./SplashScreen.css";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const uniqueId = useId().replace(/:/g, '-');
  const [showLogo, setShowLogo] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [ascanData, setAscanData] = useState<number[]>([]);
  
  // Generate A-scan waveform data
  useEffect(() => {
    const generateAscan = () => {
      const points = 100;
      const data: number[] = [];
      for (let i = 0; i < points; i++) {
        const x = i / points;
        // Simulate ultrasonic echo pattern with initial pulse and echoes
        let amplitude = 0;
        
        // Initial pulse
        if (x < 0.1) {
          amplitude = Math.sin(x * 50) * Math.exp(-x * 20) * 80;
        }
        // First echo
        else if (x > 0.3 && x < 0.35) {
          amplitude = Math.sin((x - 0.3) * 100) * Math.exp(-(x - 0.3) * 30) * 60;
        }
        // Second echo
        else if (x > 0.6 && x < 0.65) {
          amplitude = Math.sin((x - 0.6) * 100) * Math.exp(-(x - 0.6) * 30) * 40;
        }
        // Noise
        amplitude += (Math.random() - 0.5) * 5;
        
        data.push(amplitude);
      }
      setAscanData(data);
    };
    
    generateAscan();
    const interval = setInterval(generateAscan, 500);
    
    return () => clearInterval(interval);
  }, []);

  // Trigger animations sequence
  useEffect(() => {
    // Start scan
    const scanInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(scanInterval);
          return 100;
        }
        return prev + 3;
      });
    }, 30);
    
    // Show logo after a short delay
    setTimeout(() => setShowLogo(true), 500);
    
    // Complete animation after 4 seconds
    const completeTimeout = setTimeout(() => {
      onComplete();
    }, 4000);
    
    return () => {
      clearInterval(scanInterval);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="splash-screen fixed inset-0 z-50 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #000511 0%, #001122 50%, #000000 100%)' }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
      >
        {/* Ultrasonic depth grid background */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <defs>
            <pattern id={`depth-grid-${uniqueId}`} width="50" height="50" patternUnits="userSpaceOnUse">
              <rect width="50" height="1" fill="rgba(0, 255, 255, 0.3)" />
              <rect width="1" height="50" fill="rgba(0, 255, 255, 0.3)" />
              <text x="5" y="45" fill="rgba(0, 255, 255, 0.2)" fontSize="8" fontFamily="monospace">
                {Math.floor(Math.random() * 100)}mm
              </text>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#depth-grid-${uniqueId})`} />
        </svg>

        {/* Main content container */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          
          {/* Ultrasonic pulse rings (simplified) */}
          {[1, 2].map((ring) => (
            <motion.div
              key={`ring-${ring}`}
              className="absolute rounded-full"
              style={{
                width: `${300 + ring * 60}px`,
                height: `${300 + ring * 60}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                border: '1px solid rgba(0, 255, 255, 0.2)',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{
                duration: 2 + ring * 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}

          {/* A-Scan waveform display */}
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-24 opacity-50">
            <svg viewBox="0 0 400 100" className="w-full h-full">
              {/* Grid lines */}
              <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(0, 255, 255, 0.2)" strokeWidth="1" />
              <line x1="0" y1="0" x2="0" y2="100" stroke="rgba(0, 255, 255, 0.2)" strokeWidth="1" />
              
              {/* A-scan waveform */}
              <motion.polyline
                points={ascanData.map((v, i) => `${i * 4},${50 - v / 2}`).join(' ')}
                fill="none"
                stroke="rgba(0, 255, 255, 0.8)"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.5 }}
              />
              
              {/* Axis labels */}
              <text x="5" y="95" fill="rgba(0, 255, 255, 0.5)" fontSize="10" fontFamily="monospace">
                Time (μs)
              </text>
              <text x="5" y="10" fill="rgba(0, 255, 255, 0.5)" fontSize="10" fontFamily="monospace">
                Amplitude
              </text>
            </svg>
          </div>

          {/* Logo with effects */}
          <AnimatePresence>
            {showLogo && (
              <motion.div
                className="logo-container relative mb-8"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: 1,
                  opacity: 1
                }}
                transition={{
                  duration: 1,
                  type: "spring",
                  stiffness: 100
                }}
              >                
                {/* Main logo */}
                <motion.img
                  src={smLogo}
                  alt="SM Logo"
                  className="relative z-10"
                  style={{
                    width: '200px',
                    height: '200px',
                    filter: 'drop-shadow(0 0 20px rgba(0, 150, 255, 0.6))',
                  }}
                />

                {/* Subtle glow */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle, rgba(0, 150, 255, 0.1) 0%, transparent 70%)',
                    filter: 'blur(20px)'
                  }}
                  animate={{
                    opacity: [0.5, 0.7, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text under logo */}
          {showLogo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-center"
            >
              <motion.h1 
                className="text-2xl font-bold text-cyan-400 tracking-wider mb-2"
                style={{
                  textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
                }}
              >
                ULTRASONIC INSPECTION SYSTEM
              </motion.h1>
              
              {/* Loading progress bar */}
              <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto mb-4">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300"
                  initial={{ width: "0%" }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              
              <motion.div className="flex items-center justify-center gap-2">
                <span className="text-sm text-cyan-300/60 tracking-widest font-mono">
                  CALIBRATING TRANSDUCER
                </span>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Ultrasonic measurement overlay - bottom corners */}
        <div className="absolute bottom-4 left-4 text-cyan-400/50 font-mono text-xs">
          <div>FREQ: 5.0 MHz</div>
          <div>GAIN: 42 dB</div>
          <div>RANGE: 250mm</div>
        </div>
        
        <div className="absolute bottom-4 right-4 text-cyan-400/50 font-mono text-xs text-right">
          <div>VELOCITY: 5920 m/s</div>
          <div>PROBE: 70° L-Wave</div>
          <div>MODE: PULSE-ECHO</div>
        </div>
        
        {/* Scanning progress indicator */}
        <div className="absolute top-4 right-4 text-cyan-400/50 font-mono text-xs">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            SCAN: {Math.round(scanProgress)}%
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;