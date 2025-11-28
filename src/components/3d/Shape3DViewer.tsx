import { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { getGeometryByType } from './ShapeGeometries';
import { getMaterialByMaterialType } from './ShapeMaterials';

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
  const geometry = getGeometryByType(partType);
  const metalMaterial = getMaterialByMaterialType(material);
  
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

  useFrame((state) => {
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

export default function Shape3DViewer({ 
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
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    >
      {isVisible && (
        <Canvas
          key={`${currentPartType}-${resetKey}`}
          gl={{ 
            antialias: isActive || isHovered,
            alpha: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
          }}
          dpr={isActive ? 2 : isHovered ? 1.5 : 1}
          frameloop={isActive || isHovered ? "always" : "demand"}
          resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
          camera={{ position: [0, 0, 5], fov: 50 }}
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
            
            <ambientLight intensity={isActive || isHovered ? 0.4 : 0.6} />
            <directionalLight 
              position={[5, 5, 5]} 
              intensity={isActive || isHovered ? 1 : 0.8} 
              castShadow={isActive || isHovered}
            />
            <directionalLight 
              position={[-5, 3, -5]} 
              intensity={isActive || isHovered ? 0.4 : 0.3} 
            />
            
            {(isActive || isHovered) && (
              <>
                <directionalLight position={[0, -5, 0]} intensity={0.3} color="#4488ff" />
                <pointLight position={[0, 0, 10]} intensity={0.8} color={color} />
                {/* Removed Environment preset that loaded remote HDRI (venice_sunset_1k.hdr)
                    because the external URL started returning 404 and crashed the 3D view.
                    The existing custom lights above provide sufficient lighting without
                    relying on an external asset. */}
              </>
            )}
            
            <Shape3DMesh 
              partType={currentPartType} 
              color={color}
              material={material}
              isHovered={isHovered}
              isActive={isActive}
              mouseX={mouseX}
              mouseY={mouseY}
            />
            
            {(isHovered || isActive) && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
                <planeGeometry args={[10, 10]} />
                <shadowMaterial opacity={0.4} />
              </mesh>
            )}
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
