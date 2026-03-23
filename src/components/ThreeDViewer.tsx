import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { PartGeometry, MaterialType } from "@/types/techniqueSheet";
import { Button } from "@/components/ui/button";
import { RotateCcw, Navigation, Loader2, AlertTriangle } from "lucide-react";
import { useRef, useMemo, useState, useEffect, memo, useCallback, Suspense } from "react";
import * as THREE from "three";
import { getMaterialByMaterialType } from "./3d/ShapeMaterials";
import { getGeometryByType } from "./3d/ShapeGeometries";
import { Skeleton } from "@/components/ui/skeleton";

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

// Fallback component when WebGL is not available
const WebGLFallback = memo(function WebGLFallback({ partType, material, dimensions }: {
  partType: PartGeometry | "";
  material?: MaterialType | "";
  dimensions?: { thickness?: number };
}) {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border border-border overflow-hidden flex flex-col items-center justify-center p-4">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 max-w-sm text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
        <h3 className="text-sm font-medium text-foreground mb-1">3D Preview Unavailable</h3>
        <p className="text-xs text-muted-foreground mb-3">
          WebGL is not supported or disabled in your browser. The 3D visualization requires WebGL to render.
        </p>
        <div className="bg-card/50 rounded p-2 text-left">
          <p className="text-xs font-medium text-foreground mb-1">Part Configuration:</p>
          <p className="text-xs text-muted-foreground">
            {partType ? `Type: ${partType}` : 'No part type selected'}
          </p>
          {material && <p className="text-xs text-muted-foreground">Material: {material}</p>}
          {dimensions?.thickness && <p className="text-xs text-muted-foreground">Thickness: {dimensions.thickness}mm</p>}
        </div>
      </div>
    </div>
  );
});

// Debounce hook for smooth updates without flickering
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Deep comparison for objects
function useDeepMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  
  if (JSON.stringify(value) !== JSON.stringify(ref.current)) {
    ref.current = value;
  }
  
  return ref.current;
}

interface ThreeDViewerProps {
  partType: PartGeometry | "";
  material?: MaterialType | "";
  dimensions?: {
    length: number;
    width: number;
    thickness: number;
    diameter?: number;
    isHollow?: boolean;
    innerDiameter?: number;
    innerLength?: number;
    innerWidth?: number;
    wallThickness?: number;
    // Cone-specific dimensions
    coneTopDiameter?: number;
    coneBottomDiameter?: number;
    coneHeight?: number;
  };
}


// Component for hollow tube with real hole
const HollowTube = ({ material, outerRadius, innerRadius, length }: { material: THREE.MeshStandardMaterial; outerRadius: number; innerRadius: number; length: number }) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    
    const extrudeSettings = {
      depth: length,
      bevelEnabled: false,
      steps: 1
    };
    
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateY(Math.PI / 2);
    geom.translate(0, 0, -length / 2);
    return geom;
  }, [outerRadius, innerRadius, length]);
  
  // Clone material and set double-sided
  const tubeMaterial = useMemo(() => {
    const mat = material.clone();
    mat.side = THREE.DoubleSide;
    return mat;
  }, [material]);
  
  return (
    <mesh castShadow receiveShadow geometry={geometry} material={tubeMaterial} />
  );
};

// Component for hollow ring with real hole
const HollowRing = ({ material, outerRadius, innerRadius, height }: { material: THREE.MeshStandardMaterial; outerRadius: number; innerRadius: number; height: number }) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    
    const extrudeSettings = {
      depth: height,
      bevelEnabled: false,
      steps: 1
    };
    
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(Math.PI / 2);
    geom.translate(0, 0, -height / 2);
    return geom;
  }, [outerRadius, innerRadius, height]);
  
  // Clone material and set double-sided
  const ringMaterial = useMemo(() => {
    const mat = material.clone();
    mat.side = THREE.DoubleSide;
    return mat;
  }, [material]);
  
  return (
    <mesh castShadow receiveShadow geometry={geometry} material={ringMaterial} />
  );
};

// Memoized Part component to prevent unnecessary re-renders
const Part = memo(function Part({ partType, material, dimensions }: ThreeDViewerProps) {
  // Shorter debounce for more responsive updates (150ms)
  const debouncedDimensions = useDebounce(dimensions, 150);
  
  // Get metallic material based on material type (aerospace metals)
  const metalMaterial = useMemo(() => getMaterialByMaterialType(material), [material]);

  // Calculate scale based on debounced dimensions
  const scale = useMemo((): [number, number, number] => {
    if (!debouncedDimensions) return [1, 1, 1];

    const baseSize = 1;
    const isRound = partType === 'cylinder' || partType === 'tube' || partType === 'cone' || partType === 'sphere';

    if (isRound && debouncedDimensions.diameter) {
      // For round parts, use uniform YZ scale from diameter to preserve circular cross-section
      const diameterScale = debouncedDimensions.diameter / 75;
      const lengthScale = debouncedDimensions.length ? debouncedDimensions.length / 100 : diameterScale;
      return [lengthScale, diameterScale, diameterScale];
    }

    const scaleX = debouncedDimensions.length ? debouncedDimensions.length / 100 : baseSize;
    const scaleY = debouncedDimensions.thickness ? debouncedDimensions.thickness / 50 : baseSize;
    const scaleZ = debouncedDimensions.width ? debouncedDimensions.width / 75 : baseSize;

    return [scaleX, scaleY, scaleZ];
  }, [debouncedDimensions, partType]);

  // Use deep comparison for geometry parameters to ensure updates
  const geometryParams = useDeepMemo({
    isHollow: debouncedDimensions?.isHollow || false,
    outerDiameter: debouncedDimensions?.diameter || 0,
    innerDiameter: debouncedDimensions?.innerDiameter || 0,
    length: debouncedDimensions?.length || 0,
    width: debouncedDimensions?.width || 0,
    thickness: debouncedDimensions?.thickness || 0,
    innerLength: debouncedDimensions?.innerLength || 0,
    innerWidth: debouncedDimensions?.innerWidth || 0,
    wallThickness: debouncedDimensions?.wallThickness || 0,
    // Cone-specific parameters - use undefined if not set so geometry uses proper defaults
    coneTopDiameter: debouncedDimensions?.coneTopDiameter || undefined,
    coneBottomDiameter: debouncedDimensions?.coneBottomDiameter || undefined,
    coneHeight: debouncedDimensions?.coneHeight || undefined,
  });

  // Use the same geometry as Shape3DViewer for consistency.
  // IMPORTANT: Hooks must run in the same order on every render.
  // We therefore compute geometry even when partType is empty, and
  // fall back to a placeholder geometry.
  const geometry = useMemo(() => {
    const geom = partType
      ? getGeometryByType(partType, geometryParams)
      : new THREE.BoxGeometry(1, 0.5, 0.5);

    geom.computeBoundingBox();
    geom.computeVertexNormals();
    return geom;
  }, [partType, geometryParams]);
  
  // When no part type selected, show a neutral placeholder material.
  const resolvedMaterial = partType
    ? metalMaterial
    : (new THREE.MeshStandardMaterial({ color: "#A0A0A0", metalness: 0.8, roughness: 0.3 }));

  return <mesh castShadow receiveShadow geometry={geometry} material={resolvedMaterial} scale={scale} />;
});

// Loading fallback for 3D canvas
const CanvasLoader = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10">
    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
    <p className="text-xs text-muted-foreground">Loading 3D view...</p>
  </div>
);

export const ThreeDViewer = memo(function ThreeDViewer(props: ThreeDViewerProps) {
  const controlsRef = useRef<any>();
  const [isLoading, setIsLoading] = useState(true);
  const [webglSupported] = useState(() => isWebGLSupported());

  const handleReset = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  // Only re-render Canvas when part type or material changes (not dimensions - handled by Part component)
  const viewerKey = useMemo(() => {
    return `${props.partType}-${props.material}`;
  }, [props.partType, props.material]);

  // Show loading state briefly when part type changes
  useEffect(() => {
    if (webglSupported) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [props.partType, props.material, webglSupported]);

  // If WebGL is not supported, show fallback
  if (!webglSupported) {
    return <WebGLFallback partType={props.partType} material={props.material} dimensions={props.dimensions} />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[1.1rem] border border-border bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950 transition-opacity duration-200">
      {isLoading && <CanvasLoader />}
      <Canvas
        key={viewerKey}
        shadows
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false
        }}
        dpr={[1, 2]}
        frameloop="demand"
        onCreated={() => setIsLoading(false)}
      >
        <color attach="background" args={["#0b1220"]} />
        <fog attach="fog" args={["#0b1220", 6, 14]} />
        <PerspectiveCamera makeDefault position={[3, 2, 3]} />
        <OrbitControls 
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={10}
        />
        
        {/* Lighting - shifted from generic preview to studio-style rig */}
        <ambientLight intensity={0.45} />
        <hemisphereLight args={["#dbeafe", "#0f172a", 0.65]} />
        <directionalLight
          position={[10, 10, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <spotLight
          position={[4, 6, 3]}
          angle={0.45}
          penumbra={0.7}
          intensity={1.7}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-6, 4, 5]} intensity={0.75} />
        <directionalLight position={[0, 3, -6]} intensity={0.45} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.02, 0]} receiveShadow>
          <planeGeometry args={[18, 18]} />
          <meshStandardMaterial color="#111827" metalness={0.08} roughness={0.92} />
        </mesh>
        <gridHelper args={[12, 24, "#2563eb", "#334155"]} position={[0, -1, 0]} />
        {/* Part */}
        <Part {...props} />
      </Canvas>

      {/* Controls overlay */}
      <div className="absolute bottom-4 right-4 flex gap-2 animate-fade-in">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleReset}
          className="border border-white/10 bg-slate-900/80 shadow-lg backdrop-blur-md"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset View
        </Button>
      </div>

      {/* Info overlay */}
      <div className="absolute left-4 top-4 max-w-[210px] rounded-2xl border border-white/10 bg-slate-900/82 p-3 shadow-lg backdrop-blur-md animate-fade-in transition-all duration-200">
        <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-2">
          <Navigation className="h-3 w-3" />
          Part Visualization
        </p>
        <p className="text-xs text-muted-foreground transition-colors duration-200">
          {props.partType ?
            `${props.partType.charAt(0).toUpperCase() + props.partType.slice(1)} • ${props.material || "No material"}` :
            "Configure part geometry"
          }
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {props.dimensions && `${props.dimensions.thickness}mm thick`}
        </p>
      </div>
    </div>
  );
});
