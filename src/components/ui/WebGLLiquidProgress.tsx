import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree, invalidate } from '@react-three/fiber';
import * as THREE from 'three';

// Check if WebGL is supported
function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return gl !== null;
  } catch (e) {
    return false;
  }
}

// CSS-based fallback progress bar
const CSSFallbackProgress = ({ progress, completedFields, totalFields, className = '' }: {
  progress: number;
  completedFields: number;
  totalFields: number;
  className?: string;
}) => (
  <div className={`w-full bg-slate-950 border-y border-slate-800 shadow-xl ${className}`}>
    <div className="max-w-full mx-auto px-3 py-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-slate-300 tracking-widest">PROGRESS</span>
          <span className="text-xs text-slate-500">{completedFields}/{totalFields} fields</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-slate-600">ScanMaster</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              progress === 100 ? 'bg-green-500' :
              progress > 0 ? 'bg-orange-500 animate-pulse' : 'bg-slate-700'
            }`} />
            <span className="text-xs text-slate-400">
              {progress === 100 ? 'Complete' : progress > 0 ? 'Active' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* CSS Progress Bar */}
      <div className="relative h-20 md:h-24 rounded-md overflow-hidden bg-slate-900 border-2 border-slate-700">
        {/* Progress fill */}
        <div 
          className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
          style={{ 
            width: `${progress}%`,
            background: progress === 100 
              ? 'linear-gradient(90deg, #059669, #10b981, #34d399)'
              : 'linear-gradient(90deg, #065f46, #059669, #10b981)'
          }}
        >
          {/* Animated wave effect */}
          <div className="absolute inset-0 opacity-30" style={{
            background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
            animation: 'wave 2s linear infinite'
          }} />
        </div>

        {/* Percentage badge */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-slate-900/90 backdrop-blur px-4 py-2 rounded border border-slate-700">
          <span className={`text-2xl font-bold font-mono ${
            progress === 100 ? 'text-green-400' : 'text-white'
          }`}>
            {Math.round(progress)}%
          </span>
        </div>

        {/* Scale */}
        <div className="absolute bottom-2 left-3 right-20 flex justify-between z-20">
          {[0, 25, 50, 75, 100].map((mark) => (
            <div key={mark} className="flex flex-col items-center">
              <div className="w-px h-2 bg-slate-600" />
              <span className="text-[9px] text-slate-500 font-mono">{mark}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Vertex Shader
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment Shader - Realistic Water/Liquid Effect
const fragmentShader = `
  uniform float uTime;
  uniform float uProgress;

  varying vec2 vUv;

  // Simplex noise function for organic movement
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    float progress = uProgress;
    float time = uTime * 0.3;

    // === LIQUID SURFACE WAVE ===
    // Create organic wave at the liquid surface (vertical edge)
    float waveY = uv.y - 0.5;
    float wave1 = sin(waveY * 8.0 + time * 0.8) * 0.008;
    float wave2 = sin(waveY * 12.0 - time * 1.2) * 0.005;
    float wave3 = snoise(vec2(uv.y * 4.0, time * 0.5)) * 0.006;
    float totalWave = wave1 + wave2 + wave3;

    // Liquid fill boundary with wave
    float liquidEdge = progress + totalWave;
    bool inLiquid = uv.x < liquidEdge && progress > 0.001;

    if (inLiquid) {
      // === BASE LIQUID COLOR (Emerald Green Coolant) ===
      vec3 deepColor = vec3(0.0, 0.15, 0.08);      // Very dark green (deep)
      vec3 bodyColor = vec3(0.05, 0.4, 0.2);       // Rich green (body)
      vec3 surfaceColor = vec3(0.15, 0.6, 0.35);   // Bright green (near surface)

      // Depth factor - darker at bottom
      float depthFactor = uv.y;
      vec3 liquidColor = mix(deepColor, bodyColor, pow(depthFactor, 0.7));
      liquidColor = mix(liquidColor, surfaceColor, pow(depthFactor, 2.0));

      // === INTERNAL REFRACTION/DISTORTION ===
      float distortion = snoise(vec2(uv.x * 10.0 + time * 0.2, uv.y * 8.0)) * 0.03;
      liquidColor += distortion * vec3(0.05, 0.15, 0.08);

      // === SURFACE HIGHLIGHT (where light enters) ===
      float surfaceHighlight = smoothstep(0.7, 0.95, uv.y);
      surfaceHighlight *= smoothstep(0.0, 0.3, uv.x); // Fade at left edge
      liquidColor += surfaceHighlight * vec3(0.1, 0.25, 0.15);

      // === CAUSTICS (light patterns at bottom) ===
      float caustic = snoise(vec2(uv.x * 15.0 + time * 0.3, uv.y * 10.0 - time * 0.2));
      caustic = pow(caustic * 0.5 + 0.5, 3.0);
      caustic *= (1.0 - depthFactor) * 0.15; // Stronger at bottom
      liquidColor += caustic * vec3(0.1, 0.3, 0.15);

      // === BUBBLES ===
      // Create multiple bubble layers
      for (float i = 0.0; i < 3.0; i++) {
        float bubbleSpeed = 0.15 + i * 0.08;
        float bubbleSize = 0.015 - i * 0.003;
        float bubbleX = fract(uv.x * (8.0 + i * 3.0) + i * 0.3);
        float bubbleY = fract(uv.y + time * bubbleSpeed + i * 0.33);

        // Only show bubbles in liquid area and not at very edge
        float edgeDist = liquidEdge - uv.x;
        if (edgeDist > 0.03) {
          float bubble = smoothstep(bubbleSize, 0.0, length(vec2(bubbleX - 0.5, bubbleY - 0.5) * vec2(1.0, 2.0)));
          bubble *= 0.3;
          // Bubble highlight (top-left of bubble)
          float bubbleHighlight = smoothstep(bubbleSize * 0.7, 0.0, length(vec2(bubbleX - 0.45, bubbleY - 0.55) * vec2(1.0, 2.0)));
          liquidColor += bubble * vec3(0.1, 0.2, 0.12);
          liquidColor += bubbleHighlight * 0.15 * vec3(0.3, 0.5, 0.35);
        }
      }

      // === MENISCUS AT LIQUID EDGE ===
      float edgeDist = liquidEdge - uv.x;
      if (edgeDist < 0.025 && edgeDist > 0.0) {
        // Curved meniscus - liquid climbs walls due to surface tension
        float meniscusStrength = pow(1.0 - edgeDist / 0.025, 2.0);
        float wallCurve = pow(abs(uv.y - 0.5) * 2.0, 0.5); // Curves up at top and bottom

        // Bright edge reflection
        liquidColor += meniscusStrength * (0.2 + wallCurve * 0.3) * vec3(0.2, 0.5, 0.3);

        // Darker inner edge (shadow from curve)
        if (edgeDist > 0.01) {
          liquidColor -= (1.0 - meniscusStrength) * 0.1 * vec3(0.05, 0.1, 0.06);
        }
      }

      // === SPECULAR HIGHLIGHTS (wet glossy look) ===
      float spec1 = pow(max(0.0, snoise(vec2(uv.x * 20.0, uv.y * 5.0 + time * 0.1))), 4.0);
      float spec2 = pow(max(0.0, sin(uv.x * 30.0 + uv.y * 10.0)), 6.0);
      float specular = (spec1 * 0.1 + spec2 * 0.05) * depthFactor;
      liquidColor += specular * vec3(0.4, 0.7, 0.5);

      // === FRESNEL-LIKE EDGE DARKENING ===
      float edgeDark = smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.85, uv.y);
      liquidColor *= 0.85 + edgeDark * 0.15;

      gl_FragColor = vec4(liquidColor, 0.95);
    } else {
      // === EMPTY TANK (glass look) ===
      vec3 tankColor = vec3(0.03, 0.035, 0.045);

      // Subtle glass reflection
      float glassReflect = pow(max(0.0, sin(uv.x * 50.0 + uv.y * 20.0)), 10.0) * 0.05;
      tankColor += glassReflect;

      // Vertical lines suggesting glass/acrylic panels
      float panelLine = step(0.98, fract(uv.x * 30.0)) * 0.02;
      tankColor += panelLine;

      // Slight gradient
      tankColor += uv.y * 0.02;

      gl_FragColor = vec4(tankColor, 1.0);
    }
  }
`;

interface LiquidMeshProps {
  progress: number;
}

function LiquidMesh({ progress }: LiquidMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport, invalidate: invalidateFrame } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: progress / 100 },
    }),
    []
  );

  // Request a single render when progress changes
  useEffect(() => {
    invalidateFrame();
  }, [progress, invalidateFrame]);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      material.uniforms.uProgress.value = progress / 100;
      // Only request next frame if progress is actively changing (0 < progress < 100)
      if (progress > 0 && progress < 100) {
        invalidateFrame();
      }
    }
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height * 0.55, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}

// Clean, visible probe marker
function ProbeMarker({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport, invalidate: invalidateFrame } = useThree();

  // Request render when progress changes
  useEffect(() => {
    invalidateFrame();
  }, [progress, invalidateFrame]);

  useFrame(() => {
    if (groupRef.current) {
      const x = -viewport.width / 2 + (progress / 100) * viewport.width;
      groupRef.current.position.x = x;
    }
  });

  const isComplete = progress >= 100;
  const isActive = progress > 0 && progress < 100;

  return (
    <group ref={groupRef} position={[0, 0, 0.05]}>
      {/* Vertical line marker - very visible */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[0.006, 0.5]} />
        <meshBasicMaterial
          color={isComplete ? '#22c55e' : '#f97316'}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Top triangle pointer */}
      <mesh position={[0, 0.28, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.025, 0.04, 3]} />
        <meshBasicMaterial color={isComplete ? '#22c55e' : '#f97316'} />
      </mesh>

      {/* Bottom triangle pointer */}
      <mesh position={[0, -0.28, 0]}>
        <coneGeometry args={[0.025, 0.04, 3]} />
        <meshBasicMaterial color={isComplete ? '#22c55e' : '#f97316'} />
      </mesh>

      {/* Glow effect behind marker */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[0.04, 0.55]} />
        <meshBasicMaterial
          color={isComplete ? '#22c55e' : '#fb923c'}
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Pulsing ring when active */}
      {isActive && (
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[0.03, 0.045, 32]} />
          <meshBasicMaterial
            color="#fb923c"
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
}

interface WebGLLiquidProgressProps {
  value: number;
  completedFields: number;
  totalFields: number;
  className?: string;
}

export const WebGLLiquidProgress = ({
  value,
  completedFields,
  totalFields,
  className = '',
}: WebGLLiquidProgressProps) => {
  const progress = Math.max(0, Math.min(100, value));
  const [webglSupported] = useState(() => isWebGLSupported());

  // If WebGL is not supported, use CSS fallback
  if (!webglSupported) {
    return <CSSFallbackProgress progress={progress} completedFields={completedFields} totalFields={totalFields} className={className} />;
  }

  return (
    <div className={`w-full bg-slate-950 border-y border-slate-800 shadow-xl ${className}`}>
      <div className="max-w-full mx-auto px-2 py-1">
        {/* Header */}
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-300 tracking-wider">PROGRESS</span>
            <span className="text-[10px] text-slate-500">{completedFields}/{totalFields}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${
              progress === 100 ? 'bg-green-500' :
              progress > 0 ? 'bg-orange-500 animate-pulse' : 'bg-slate-700'
            }`} />
            <span className="text-[10px] text-slate-400">
              {progress === 100 ? 'Complete' : progress > 0 ? 'Active' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Tank container */}
        <div className="relative h-10 rounded-md overflow-hidden bg-slate-950 border border-slate-700">
          {/* Glass effect overlay */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Top reflection */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-white/5 to-transparent" />
            {/* Bottom shadow */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-black/30 to-transparent" />
            {/* Left edge highlight */}
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-r from-white/5 to-transparent" />
          </div>

          <Canvas
            camera={{ position: [0, 0, 0.7], fov: 50 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
            dpr={[1, 1.5]}
            frameloop="demand"
          >
            <LiquidMesh progress={progress} />
            <ProbeMarker progress={progress} />
          </Canvas>

          {/* Percentage badge */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-slate-900/90 backdrop-blur px-4 py-2 rounded border border-slate-700">
            <span className={`text-2xl font-bold font-mono ${
              progress === 100 ? 'text-green-400' : 'text-white'
            }`}>
              {Math.round(progress)}%
            </span>
          </div>

          {/* Scale */}
          <div className="absolute bottom-2 left-3 right-20 flex justify-between z-20">
            {[0, 25, 50, 75, 100].map((mark) => (
              <div key={mark} className="flex flex-col items-center">
                <div className="w-px h-2 bg-slate-600" />
                <span className="text-[9px] text-slate-500 font-mono">{mark}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
