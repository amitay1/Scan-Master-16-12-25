import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { PartGeometry, MaterialType } from "@/types/techniqueSheet";
import { Button } from "@/components/ui/button";
import { RotateCcw, Navigation, Loader2 } from "lucide-react";
import { useRef, useMemo, useState, useEffect, memo, useCallback, Suspense } from "react";
import * as THREE from "three";
import { getMaterialByMaterialType } from "./3d/ShapeMaterials";
import { getGeometryByType } from "./3d/ShapeGeometries";
import { Skeleton } from "@/components/ui/skeleton";

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
    const scaleX = debouncedDimensions.length ? debouncedDimensions.length / 100 : baseSize;
    const scaleY = debouncedDimensions.thickness ? debouncedDimensions.thickness / 50 : baseSize;
    const scaleZ = debouncedDimensions.width ? debouncedDimensions.width / 75 : baseSize;
    
    return [scaleX, scaleY, scaleZ];
  }, [debouncedDimensions]);

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
    // Cone-specific parameters
    coneTopDiameter: debouncedDimensions?.coneTopDiameter || 0,
    coneBottomDiameter: debouncedDimensions?.coneBottomDiameter || 0,
    coneHeight: debouncedDimensions?.coneHeight || 0,
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
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [props.partType, props.material]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border border-border overflow-hidden transition-opacity duration-200">
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
        <PerspectiveCamera makeDefault position={[3, 2, 3]} />
        <OrbitControls 
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={10}
        />
        
        {/* Lighting - Enhanced for better visibility */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[10, 10, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-10, 10, 10]} intensity={1.0} />
        <directionalLight position={[0, -10, -10]} intensity={0.6} />
        <directionalLight position={[0, 10, -10]} intensity={0.8} />
        <directionalLight position={[-5, -5, 10]} intensity={0.5} />
        
        {/* Grid */}
        <gridHelper args={[10, 10, "#3b82f6", "#94a3b8"]} position={[0, -1, 0]} />
        
        {/* Part */}
        <Part {...props} />
      </Canvas>

      {/* Controls overlay */}
      <div className="absolute bottom-4 right-4 flex gap-2 animate-fade-in">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleReset}
          className="shadow-lg backdrop-blur-sm"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset View
        </Button>
      </div>

      {/* Info overlay */}
      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-md p-3 border border-border shadow-lg animate-fade-in transition-all duration-200">
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
