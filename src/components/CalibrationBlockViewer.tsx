import React, { Component, ErrorInfo, ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Html } from "@react-three/drei";
import { CalibrationRecommendation } from "@/types/techniqueSheet";
import * as THREE from "three";

/**
 * Error boundary for 3D viewer - prevents app crashes
 */
interface ErrorBoundaryState {
  hasError: boolean;
}

class Viewer3DErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('CalibrationBlockViewer error caught:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border border-border text-muted-foreground">
          <p className="text-sm">3D Preview unavailable</p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface CalibrationBlockViewerProps {
  recommendation: CalibrationRecommendation;
}

const CalibrationBlock = ({ recommendation }: CalibrationBlockViewerProps) => {
  const [length, width, height] = recommendation.visualization3D.blockDimensions;
  const scale = 0.01; // Scale to scene units - with safety checks
  
  const l = Math.max(length * scale, 0.1);
  const w = Math.max(width * scale, 0.1);
  const h = Math.max(height * scale, 0.1);

  return (
    <group>
      {/* Main block */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[l, h, w]} />
        <meshStandardMaterial 
          color="#B0B0B8" 
          metalness={0.7} 
          roughness={0.3}
          transparent
          opacity={0.6}
        />
      </mesh>
      
      {/* Block edges */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(l, h, w)]} />
        <lineBasicMaterial color="#666666" linewidth={2} />
      </lineSegments>
      
      {/* FBH holes */}
      {recommendation.visualization3D.fbhPositions.map((fbh, index) => {
        const [x, y, z] = fbh.coordinates;
        const diameter = parseFloat(fbh.size.split('/')[0]) / 64 * 25.4; // Convert to mm
        const radius = Math.max(diameter * scale / 2, 0.02);
        
        return (
          <group key={index} position={[x * scale, -y * scale / 2, z * scale]}>
            {/* FBH cylinder */}
            <mesh castShadow>
              <cylinderGeometry args={[radius, radius, y * scale, 16]} />
              <meshStandardMaterial 
                color="#3b82f6" 
                metalness={0.9} 
                roughness={0.2}
              />
            </mesh>
            
            {/* Label */}
            <Html distanceFactor={10} position={[0, y * scale / 2 + 0.2, 0]}>
              <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none">
                {fbh.size}" @ {fbh.depth.toFixed(1)}mm
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

export const CalibrationBlockViewer = ({ recommendation }: CalibrationBlockViewerProps) => {
  return (
    <Viewer3DErrorBoundary>
      <div className="w-full h-full bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border border-border overflow-hidden">
        <Canvas 
          shadows
          frameloop="demand"
          gl={{
            antialias: true,
            powerPreference: 'default',
            preserveDrawingBuffer: false,
          }}
          dpr={[1, 1.5]}
        >
          <PerspectiveCamera makeDefault position={[3, 2, 3]} />
          <OrbitControls 
            enableDamping
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={8}
          />
          
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1}
            castShadow
          />
          <directionalLight position={[-5, 5, 5]} intensity={0.4} />
          {/* Environment preset "studio" removed because remote HDR may return 404 and cause crashes */}

          {/* Grid */}
          <gridHelper args={[5, 10, "#3b82f6", "#94a3b8"]} position={[0, -1, 0]} />
          
          {/* Calibration block */}
          <CalibrationBlock recommendation={recommendation} />
        </Canvas>
      </div>
    </Viewer3DErrorBoundary>
  );
};
