import React, { useRef, useEffect, useState, Suspense, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { getGeometryByType } from './ShapeGeometries';
import { getMaterialByMaterialType } from './ShapeMaterials';

/**
 * Error boundary for 3D components - prevents app crashes
 */
interface ErrorBoundaryState {
  hasError: boolean;
}

class Canvas3DErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('3D Viewer error caught:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          color: '#666',
          fontSize: '12px'
        }}>
          3D Preview
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Premium studio lighting setup for high-end metallic materials
 */
function PremiumLighting({ isActive, isHovered, accentColor }: {
  isActive: boolean;
  isHovered: boolean;
  accentColor: string;
}) {
  const intensity = isActive || isHovered ? 1.2 : 0.8;
  // Ensure accentColor is always a valid color string
  const safeAccentColor = accentColor || '#ffffff';

  return (
    <>
      {/* Key light - main illumination from top-right */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={intensity * 1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />

      {/* Fill light - softer from left side */}
      <directionalLight
        position={[-5, 3, -3]}
        intensity={intensity * 0.7}
        color="#e0e8ff"
      />

      {/* Rim light - highlights edges from behind */}
      <directionalLight
        position={[0, 2, -8]}
        intensity={intensity * 0.5}
        color="#ffffff"
      />

      {/* Bottom fill - reduces harsh shadows */}
      <directionalLight
        position={[0, -5, 0]}
        intensity={0.25}
        color="#4488cc"
      />

      {/* Ambient for overall fill */}
      <ambientLight intensity={isActive || isHovered ? 0.4 : 0.5} color="#f5f5ff" />

      {/* Hemisphere light for natural sky/ground gradient */}
      <hemisphereLight
        args={['#b1e1ff', '#b97a20', isActive || isHovered ? 0.5 : 0.35]}
      />

      {/* Accent point light with material color - adds glow effect */}
      {(isActive || isHovered) && (
        <>
          <pointLight
            position={[3, 0, 5]}
            intensity={0.8}
            color={safeAccentColor}
            distance={15}
            decay={2}
          />
          <pointLight
            position={[-3, 2, 3]}
            intensity={0.4}
            color="#ffffff"
            distance={12}
            decay={2}
          />
        </>
      )}
    </>
  );
}

interface Shape3DMeshProps {
  partType: string;
  color: string;
  material?: string;
  isHovered: boolean;
  isActive: boolean;
  mouseX: number;
  mouseY: number;
}

function Shape3DMesh({ partType, color, material, isHovered, isActive, mouseX, mouseY }: Shape3DMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Memoize geometry and material to prevent recreation on every render
  const geometry = useMemo(() => getGeometryByType(partType), [partType]);
  const metalMaterial = useMemo(() => getMaterialByMaterialType(material), [material]);

  // Store initial state to reset to
  const initialStateRef = useRef({
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    scale: 1
  });

  // Reset rotation when partType changes
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.rotation.set(0, 0, 0);
      meshRef.current.position.set(0, 0, 0);
      meshRef.current.scale.setScalar(1);
      initialStateRef.current = {
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
        scale: 1
      };
    }
  }, [partType]);

  // CRITICAL: Reset when entering interactive mode
  useEffect(() => {
    if (isActive && meshRef.current) {
      // Force immediate reset for interactive mode
      meshRef.current.rotation.set(0, 0, 0);
      meshRef.current.position.set(0, 0, 0);
      meshRef.current.scale.setScalar(1);
    }
  }, [isActive]);

  // CRITICAL: Immediate reset when exiting active mode
  useEffect(() => {
    if (!isActive && !isHovered && meshRef.current) {
      // Force immediate center position when closing
      meshRef.current.position.set(0, 0, 0);
      meshRef.current.scale.setScalar(1);
    }
  }, [isActive, isHovered]);

  useFrame(() => {
    if (!meshRef.current) return;

    if (isActive) {
      // Interactive mode - Centered with strong pop-out effect
      meshRef.current.position.x = 0;
      meshRef.current.position.y = 0;
      // Stronger pop-out than hover
      const targetZ = 0.6;
      meshRef.current.position.z += (targetZ - meshRef.current.position.z) * 0.1;

      // Larger scale than hover
      const targetScale = 1.3;
      const currentScale = meshRef.current.scale.x;
      meshRef.current.scale.setScalar(currentScale + (targetScale - currentScale) * 0.1);
      // OrbitControls handles rotation
    } else if (isHovered) {
      // Interactive rotation based on mouse position
      const targetRotX = (mouseY - 0.5) * 0.5;
      const targetRotY = (mouseX - 0.5) * 0.5;

      meshRef.current.rotation.x += (targetRotX - meshRef.current.rotation.x) * 0.1;
      meshRef.current.rotation.y += (targetRotY - meshRef.current.rotation.y) * 0.1;

      // Pop out effect - ONLY Z axis, X and Y stay at 0
      meshRef.current.position.x = 0;
      meshRef.current.position.y = 0;
      const targetZ = 0.3;
      meshRef.current.position.z += (targetZ - meshRef.current.position.z) * 0.1;

      // Slight scale up
      const targetScale = 1.1;
      const currentScale = meshRef.current.scale.x;
      meshRef.current.scale.setScalar(currentScale + (targetScale - currentScale) * 0.1);
    } else {
      // Gentle auto-rotation when not hovered
      meshRef.current.rotation.x += 0.001;
      meshRef.current.rotation.y += 0.002;

      // Return to original position - CENTERED at (0,0,0)
      meshRef.current.position.x += (0 - meshRef.current.position.x) * 0.1;
      meshRef.current.position.y += (0 - meshRef.current.position.y) * 0.1;
      meshRef.current.position.z += (0 - meshRef.current.position.z) * 0.1;

      // Return to original scale
      const currentScale = meshRef.current.scale.x;
      meshRef.current.scale.setScalar(currentScale + (1 - currentScale) * 0.1);
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={metalMaterial}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
      scale={1}
      castShadow
      receiveShadow
    />
  );
}

interface Shape3DViewerProps {
  partType: string;
  color: string;
  material?: string;
  isHovered: boolean;
  isActive: boolean;
  mouseX: number;
  mouseY: number;
}

function Shape3DViewerInner({
  partType,
  color,
  material,
  isHovered,
  isActive,
  mouseX,
  mouseY
}: Shape3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentPartType, setCurrentPartType] = useState(partType);
  
  // Ensure color is always valid - default to white if undefined
  const safeColor = color || '#ffffff';
  // Ensure mouseX/mouseY are valid numbers - default to 0.5 if NaN or undefined
  const safeMouseX = (typeof mouseX === 'number' && !isNaN(mouseX)) ? mouseX : 0.5;
  const safeMouseY = (typeof mouseY === 'number' && !isNaN(mouseY)) ? mouseY : 0.5;
  const [resetKey, setResetKey] = useState(0);

  // Track part type changes to force remount
  useEffect(() => {
    if (partType !== currentPartType) {
      setCurrentPartType(partType);
      setResetKey(prev => prev + 1); // Force complete remount
    }
  }, [partType, currentPartType]);

  // Use IntersectionObserver to detect when canvas is visible
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only render when actually visible - save GPU resources
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Always show 3D when visible - shapes should display their geometry
  // The frameloop will be reduced to 'demand' when not hovered to save GPU
  const shouldRender3D = isVisible;

  // Force re-render when container becomes visible
  useEffect(() => {
    if (isVisible && containerRef.current) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        // Allow clicks to pass through to parent ShapeCard when not in interactive mode
        pointerEvents: isActive ? 'auto' : 'none'
      }}
    >
      {/* 3D shape is now always rendered when visible */}
      {shouldRender3D && (
        <Canvas
          key={`${currentPartType}-${resetKey}`}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'default',
            preserveDrawingBuffer: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
            failIfMajorPerformanceCaveat: false,
          }}
          shadows="soft"
          dpr={1}
          frameloop={isHovered || isActive ? "always" : "demand"}
          resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
          camera={{ position: [0, 0, 5], fov: 50 }}
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            canvas.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              console.warn('WebGL context lost, will restore on next render');
            });
            canvas.addEventListener('webglcontextrestored', () => {
              console.log('WebGL context restored');
            });
          }}
        >
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />

            {isActive && (
              <OrbitControls
                enableZoom={true}
                enablePan={false}
                minDistance={3}
                maxDistance={8}
                enableDamping={true}
                dampingFactor={0.05}
                target={[0, 0, 0]}
                makeDefault
              />
            )}

            {/* Environment preset removed - external HDRI violates CSP. Using PremiumLighting instead */}

            {/* Premium studio lighting */}
            <PremiumLighting
              isActive={isActive}
              isHovered={isHovered}
              accentColor={safeColor}
            />

            <Shape3DMesh
              partType={currentPartType}
              color={safeColor}
              material={material}
              isHovered={isHovered}
              isActive={isActive}
              mouseX={safeMouseX}
              mouseY={safeMouseY}
            />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

// Wrap the default export with error boundary
function Shape3DViewerWithErrorBoundary(props: Shape3DViewerProps) {
  return (
    <Canvas3DErrorBoundary>
      <Shape3DViewerInner {...props} />
    </Canvas3DErrorBoundary>
  );
}

export default Shape3DViewerWithErrorBoundary;
