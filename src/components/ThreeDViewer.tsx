import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { PartGeometry, MaterialType, StandardType } from "@/types/techniqueSheet";
import { Button } from "@/components/ui/button";
import { RotateCcw, Navigation, Loader2, AlertTriangle } from "lucide-react";
import { useRef, useMemo, useState, useEffect, memo, useCallback } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { getMaterialByMaterialType } from "./3d/ShapeMaterials";
import { getGeometryByType } from "./3d/ShapeGeometries";
import { enrichMroAsset, fetchMroAssetCatalog, getRelevantMroAssets } from "@/utils/mroAssets";

function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return gl !== null;
  } catch {
    return false;
  }
}

const WebGLFallback = memo(function WebGLFallback({
  partType,
  material,
  dimensions,
}: {
  partType: PartGeometry | "";
  material?: MaterialType | "";
  dimensions?: { thickness?: number };
}) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-gradient-to-br from-muted/30 to-muted/10 p-4">
      <div className="max-w-sm rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-center">
        <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-amber-500" />
        <h3 className="mb-1 text-sm font-medium text-foreground">3D Preview Unavailable</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          WebGL is not supported or is disabled in this environment.
        </p>
        <div className="rounded bg-card/50 p-2 text-left">
          <p className="mb-1 text-xs font-medium text-foreground">Part Configuration:</p>
          <p className="text-xs text-muted-foreground">
            {partType ? `Type: ${partType}` : "No part type selected"}
          </p>
          {material && <p className="text-xs text-muted-foreground">Material: {material}</p>}
          {dimensions?.thickness && (
            <p className="text-xs text-muted-foreground">Thickness: {dimensions.thickness}mm</p>
          )}
        </div>
      </div>
    </div>
  );
});

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
  standardType?: StandardType;
  partNumber?: string;
  externalModelAssetName?: string;
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
    coneTopDiameter?: number;
    coneBottomDiameter?: number;
    coneHeight?: number;
  };
}

const Part = memo(function Part({ partType, material, dimensions }: ThreeDViewerProps) {
  const debouncedDimensions = useDebounce(dimensions, 150);
  const metalMaterial = useMemo(() => getMaterialByMaterialType(material), [material]);

  const scale = useMemo((): [number, number, number] => {
    if (!debouncedDimensions) return [1, 1, 1];

    const isRound =
      partType === "cylinder" ||
      partType === "tube" ||
      partType === "cone" ||
      partType === "sphere";

    if (isRound && debouncedDimensions.diameter) {
      const diameterScale = debouncedDimensions.diameter / 75;
      const lengthScale = debouncedDimensions.length
        ? debouncedDimensions.length / 100
        : diameterScale;
      return [lengthScale, diameterScale, diameterScale];
    }

    const scaleX = debouncedDimensions.length ? debouncedDimensions.length / 100 : 1;
    const scaleY = debouncedDimensions.thickness ? debouncedDimensions.thickness / 50 : 1;
    const scaleZ = debouncedDimensions.width ? debouncedDimensions.width / 75 : 1;

    return [scaleX, scaleY, scaleZ];
  }, [debouncedDimensions, partType]);

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
    coneTopDiameter: debouncedDimensions?.coneTopDiameter || undefined,
    coneBottomDiameter: debouncedDimensions?.coneBottomDiameter || undefined,
    coneHeight: debouncedDimensions?.coneHeight || undefined,
  });

  const geometry = useMemo(() => {
    const nextGeometry = partType
      ? getGeometryByType(partType, geometryParams)
      : new THREE.BoxGeometry(1, 0.5, 0.5);

    nextGeometry.computeBoundingBox();
    nextGeometry.computeVertexNormals();
    return nextGeometry;
  }, [partType, geometryParams]);

  const resolvedMaterial = partType
    ? metalMaterial
    : new THREE.MeshStandardMaterial({
        color: "#A0A0A0",
        metalness: 0.8,
        roughness: 0.3,
      });

  return <mesh castShadow receiveShadow geometry={geometry} material={resolvedMaterial} scale={scale} />;
});

interface ExternalModelPartProps {
  assetUrl: string;
  material?: MaterialType | "";
  onStatusChange?: (status: "loading" | "ready" | "error") => void;
}

const ExternalModelPart = memo(function ExternalModelPart({
  assetUrl,
  material,
  onStatusChange,
}: ExternalModelPartProps) {
  const { invalidate } = useThree();
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new STLLoader();

    setGeometry(null);
    onStatusChange?.("loading");

    loader.load(
      assetUrl,
      (loadedGeometry) => {
        if (cancelled) return;

        const normalizedGeometry = loadedGeometry.clone();
        normalizedGeometry.computeVertexNormals();
        normalizedGeometry.computeBoundingBox();
        normalizedGeometry.center();

        setGeometry(normalizedGeometry);
        onStatusChange?.("ready");
        invalidate();
      },
      undefined,
      () => {
        if (cancelled) return;

        onStatusChange?.("error");
        invalidate();
      },
    );

    return () => {
      cancelled = true;
    };
  }, [assetUrl, invalidate, onStatusChange]);

  const metalMaterial = useMemo(() => getMaterialByMaterialType(material), [material]);

  const scale = useMemo(() => {
    if (!geometry?.boundingBox) return 1;

    const size = new THREE.Vector3();
    geometry.boundingBox.getSize(size);
    const maxDimension = Math.max(size.x, size.y, size.z, 1);
    return 2.6 / maxDimension;
  }, [geometry]);

  if (!geometry) {
    return null;
  }

  return (
    <mesh
      castShadow
      receiveShadow
      geometry={geometry}
      material={metalMaterial}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={scale}
    />
  );
});

const CanvasLoader = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10">
    <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
    <p className="text-xs text-muted-foreground">Loading 3D view...</p>
  </div>
);

export const ThreeDViewer = memo(function ThreeDViewer(props: ThreeDViewerProps) {
  const controlsRef = useRef<any>();
  const [isLoading, setIsLoading] = useState(true);
  const [webglSupported] = useState(() => isWebGLSupported());
  const [mroAssets, setMroAssets] = useState<ReturnType<typeof enrichMroAsset>[]>([]);
  const [externalModelStatus, setExternalModelStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    let cancelled = false;

    const loadMroAssets = async () => {
      try {
        const catalog = await fetchMroAssetCatalog();
        if (!cancelled) {
          setMroAssets((catalog.assets || []).map(enrichMroAsset));
        }
      } catch {
        if (!cancelled) {
          setMroAssets([]);
        }
      }
    };

    void loadMroAssets();

    return () => {
      cancelled = true;
    };
  }, []);

  const externalModelAssets = useMemo(
    () => mroAssets.filter((asset) => asset.category === "3d-model"),
    [mroAssets],
  );

  const relevantExternalModelAssets = useMemo(
    () =>
      getRelevantMroAssets(externalModelAssets, {
        partNumber: props.partNumber,
        standard: props.standardType,
        partType: props.partType,
      }),
    [externalModelAssets, props.partNumber, props.standardType, props.partType],
  );

  const resolvedExternalModel = useMemo(() => {
    if (props.externalModelAssetName) {
      return externalModelAssets.find((asset) => asset.name === props.externalModelAssetName) || null;
    }

    if (relevantExternalModelAssets.length === 1) {
      return relevantExternalModelAssets[0];
    }

    return null;
  }, [props.externalModelAssetName, externalModelAssets, relevantExternalModelAssets]);

  const showExternalModel = Boolean(resolvedExternalModel) && externalModelStatus !== "error";

  const handleReset = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  const viewerKey = useMemo(
    () => `${props.partType}-${props.material}-${resolvedExternalModel?.name || "parametric"}`,
    [props.partType, props.material, resolvedExternalModel?.name],
  );

  useEffect(() => {
    if (!webglSupported) return;

    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [props.partType, props.material, resolvedExternalModel?.name, webglSupported]);

  useEffect(() => {
    if (resolvedExternalModel) {
      setExternalModelStatus("loading");
      return;
    }

    setExternalModelStatus("idle");
  }, [resolvedExternalModel?.assetUrl]);

  if (!webglSupported) {
    return <WebGLFallback partType={props.partType} material={props.material} dimensions={props.dimensions} />;
  }

  const viewerTitle = resolvedExternalModel
    ? `Local STL | ${resolvedExternalModel.name}`
    : props.partType
      ? `${props.partType.charAt(0).toUpperCase() + props.partType.slice(1)} | ${props.material || "No material"}`
      : "Configure part geometry";

  const viewerSubtitle = resolvedExternalModel
    ? externalModelStatus === "error"
      ? "Failed to load selected STL. Showing parametric fallback."
      : "Loaded from local MRO library"
    : relevantExternalModelAssets.length > 1 && !props.externalModelAssetName
      ? "Multiple local STL models are available. Choose one in Setup."
      : props.dimensions
        ? `${props.dimensions.thickness}mm thick`
        : "";

  return (
    <div
      data-testid="3d-viewer"
      className="three-d-viewer relative h-full w-full overflow-hidden rounded-[1.1rem] border border-border bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-950 transition-opacity duration-200"
    >
      {(isLoading || externalModelStatus === "loading") && <CanvasLoader />}

      <Canvas
        key={viewerKey}
        shadows
        className={`transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
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

        {showExternalModel && resolvedExternalModel ? (
          <ExternalModelPart
            assetUrl={resolvedExternalModel.assetUrl}
            material={props.material}
            onStatusChange={(status) => setExternalModelStatus(status)}
          />
        ) : (
          <Part {...props} />
        )}
      </Canvas>

      <div className="absolute bottom-4 right-4 flex gap-2 animate-fade-in">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleReset}
          className="border border-white/10 bg-slate-900/80 shadow-lg backdrop-blur-md"
        >
          <RotateCcw className="mr-1 h-4 w-4" />
          Reset View
        </Button>
      </div>

      <div className="absolute left-4 top-4 max-w-[280px] rounded-2xl border border-white/10 bg-slate-900/82 p-3 shadow-lg backdrop-blur-md animate-fade-in transition-all duration-200">
        <p className="mb-1 flex items-center gap-2 text-xs font-medium text-foreground">
          <Navigation className="h-3 w-3" />
          Part Visualization
        </p>
        <p className="text-xs text-muted-foreground transition-colors duration-200">{viewerTitle}</p>
        <p className="mt-1 text-xs text-muted-foreground">{viewerSubtitle}</p>
      </div>
    </div>
  );
});
