/**
 * Angle Beam Calibration Block 3D Component
 *
 * A curved/arc-shaped calibration block for shear wave (angle beam) inspection.
 * Features:
 * - Arc-shaped ring segment (~270°)
 * - Stepped notches on one side for distance calibration
 * - Reference reflector notches on curved surfaces
 *
 * Used for calibrating angle beam inspection on tubular/circular parts
 * per AMS-STD-2154 and related aerospace standards.
 */

import React, { useRef, useMemo, Component, ErrorInfo, ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Html } from "@react-three/drei";
import * as THREE from "three";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Error boundary for 3D viewer
interface ErrorBoundaryState {
  hasError: boolean;
}

class AngleBlock3DErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("AngleBeamCalibrationBlock3D error caught:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 text-slate-500">
          <p className="text-sm">3D Preview unavailable</p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface AngleBeamCalibrationBlock3DProps {
  // Block dimensions
  outerRadius?: number; // Outer radius in mm
  innerRadius?: number; // Inner radius in mm (creates the ring thickness)
  height?: number; // Height/length of the block in mm
  arcAngle?: number; // Arc angle in degrees (default ~270°)

  // Step notches configuration
  stepCount?: number; // Number of steps (default 5)
  stepWidth?: number; // Width of each step in mm

  // Material and display
  material?: "steel" | "aluminum" | "titanium";
  showDimensions?: boolean;
  showLabels?: boolean;
}

// Create arc segment geometry (ring segment)
function createArcSegmentGeometry(
  outerRadius: number,
  innerRadius: number,
  height: number,
  arcAngle: number,
  segments: number = 64
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const arcRad = (arcAngle * Math.PI) / 180;

  // Outer arc
  shape.absarc(0, 0, outerRadius, 0, arcRad, false);

  // Line to inner arc end
  shape.lineTo(
    Math.cos(arcRad) * innerRadius,
    Math.sin(arcRad) * innerRadius
  );

  // Inner arc (reversed)
  shape.absarc(0, 0, innerRadius, arcRad, 0, true);

  // Close the shape
  shape.lineTo(outerRadius, 0);

  // Extrude settings
  const extrudeSettings = {
    depth: height,
    bevelEnabled: false,
    steps: 1,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // Center the geometry
  geometry.translate(0, 0, -height / 2);

  return geometry;
}

// Stepped notch component
function SteppedNotches({
  outerRadius,
  innerRadius,
  height,
  stepCount,
  stepWidth,
  arcAngle,
  material,
}: {
  outerRadius: number;
  innerRadius: number;
  height: number;
  stepCount: number;
  stepWidth: number;
  arcAngle: number;
  material: "steel" | "aluminum" | "titanium";
}) {
  const materialColors = {
    steel: "#6b7280",
    aluminum: "#94a3b8",
    titanium: "#475569",
  };

  const wallThickness = outerRadius - innerRadius;
  const stepHeight = wallThickness / stepCount;
  const arcRad = (arcAngle * Math.PI) / 180;

  // Position at the end of the arc
  const endAngle = arcRad;

  return (
    <group>
      {Array.from({ length: stepCount }).map((_, i) => {
        // Each step cuts deeper into the block
        const currentOuterRadius = outerRadius - stepHeight * i;
        const currentInnerRadius = innerRadius;

        // Create step geometry - a small arc segment at the end
        const stepArcAngle = 8; // degrees per step
        const stepStartAngle = arcAngle - stepArcAngle * (stepCount - i);

        return (
          <mesh
            key={`step-${i}`}
            position={[0, height / 2 - (stepWidth * i) - stepWidth / 2, 0]}
          >
            <cylinderGeometry
              args={[
                currentOuterRadius,
                currentOuterRadius,
                stepWidth,
                32,
                1,
                true,
                (stepStartAngle * Math.PI) / 180,
                (stepArcAngle * Math.PI) / 180,
              ]}
            />
            <meshStandardMaterial
              color={materialColors[material]}
              roughness={0.4}
              metalness={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Reference notch (small rectangular cutout)
function ReferenceNotch({
  position,
  rotation,
  size = [3, 2, 8],
  isHighlighted = false,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number, number];
  isHighlighted?: boolean;
}) {
  const { invalidate } = useThree();
  const [hovered, setHovered] = React.useState(false);

  return (
    <group position={position} rotation={rotation}>
      <mesh
        onPointerOver={() => {
          setHovered(true);
          invalidate();
        }}
        onPointerOut={() => {
          setHovered(false);
          invalidate();
        }}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={isHighlighted || hovered ? "#ef4444" : "#1f2937"}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      {hovered && (
        <Html distanceFactor={10}>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs pointer-events-none whitespace-nowrap">
            Reference Notch
          </div>
        </Html>
      )}
    </group>
  );
}

// Main arc block geometry component
function ArcBlockGeometry({
  outerRadius,
  innerRadius,
  height,
  arcAngle,
  stepCount,
  stepWidth,
  material,
  showLabels,
}: {
  outerRadius: number;
  innerRadius: number;
  height: number;
  arcAngle: number;
  stepCount: number;
  stepWidth: number;
  material: "steel" | "aluminum" | "titanium";
  showLabels: boolean;
}) {
  const materialColors = {
    steel: "#8e9aaf",
    aluminum: "#c9d1d9",
    titanium: "#6b7280",
  };

  // Create the main arc segment geometry
  const arcGeometry = useMemo(
    () => createArcSegmentGeometry(outerRadius, innerRadius, height, arcAngle),
    [outerRadius, innerRadius, height, arcAngle]
  );

  const wallThickness = outerRadius - innerRadius;
  const midRadius = (outerRadius + innerRadius) / 2;
  const stepTotalWidth = stepWidth * stepCount;

  // Calculate positions for reference notches on the curved surface
  const notchPositions = useMemo(() => {
    const positions: Array<{
      position: [number, number, number];
      rotation: [number, number, number];
      label: string;
    }> = [];

    // Notches at different angles on outer surface
    const notchAngles = [45, 90, 135, 180, 225];
    notchAngles.forEach((angleDeg, idx) => {
      if (angleDeg < arcAngle - 10) {
        const angleRad = (angleDeg * Math.PI) / 180;
        positions.push({
          position: [
            Math.cos(angleRad) * (outerRadius - 2),
            height / 2 - 15 - idx * 15,
            Math.sin(angleRad) * (outerRadius - 2),
          ],
          rotation: [0, -angleRad + Math.PI / 2, 0],
          label: `N${idx + 1}`,
        });
      }
    });

    // Notches on inner surface (fewer)
    const innerNotchAngles = [60, 120, 180];
    innerNotchAngles.forEach((angleDeg, idx) => {
      if (angleDeg < arcAngle - 10) {
        const angleRad = (angleDeg * Math.PI) / 180;
        positions.push({
          position: [
            Math.cos(angleRad) * (innerRadius + 2),
            height / 2 - 20 - idx * 20,
            Math.sin(angleRad) * (innerRadius + 2),
          ],
          rotation: [0, -angleRad - Math.PI / 2, 0],
          label: `IN${idx + 1}`,
        });
      }
    });

    return positions;
  }, [outerRadius, innerRadius, height, arcAngle]);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {/* Main arc block */}
      <mesh geometry={arcGeometry} receiveShadow castShadow>
        <meshStandardMaterial
          color={materialColors[material]}
          roughness={0.4}
          metalness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Stepped notches at the end of the arc */}
      <group position={[0, 0, 0]}>
        {Array.from({ length: stepCount }).map((_, i) => {
          const stepDepth = (wallThickness / stepCount) * (i + 1);
          const currentRadius = outerRadius - stepDepth;
          const stepY = height / 2 - (stepTotalWidth / stepCount) * i - stepWidth / 2;
          const endAngleRad = (arcAngle * Math.PI) / 180;

          // Position the step at the end of the arc
          const stepX = Math.cos(endAngleRad) * midRadius;
          const stepZ = Math.sin(endAngleRad) * midRadius;

          return (
            <mesh
              key={`step-visual-${i}`}
              position={[stepX, stepY, stepZ]}
              rotation={[0, 0, endAngleRad]}
              receiveShadow
              castShadow
            >
              <boxGeometry
                args={[wallThickness - stepDepth, stepWidth * 0.95, wallThickness * 0.8]}
              />
              <meshStandardMaterial
                color={materialColors[material]}
                roughness={0.35}
                metalness={0.85}
              />
            </mesh>
          );
        })}
      </group>

      {/* Reference notches on curved surfaces */}
      {notchPositions.map((notch, idx) => (
        <ReferenceNotch
          key={`notch-${idx}`}
          position={notch.position}
          rotation={notch.rotation}
          size={[4, 3, 10]}
        />
      ))}

      {/* Grid floor */}
      <Grid
        args={[300, 300]}
        position={[0, -height / 2 - 20, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        cellColor="#6b7280"
        sectionColor="#374151"
        fadeDistance={200}
        fadeStrength={1}
      />
    </group>
  );
}

// Camera controls
function CameraControls() {
  const { camera, gl } = useThree();

  return (
    <OrbitControls
      args={[camera, gl.domElement]}
      enableDamping
      dampingFactor={0.05}
      minDistance={80}
      maxDistance={400}
      maxPolarAngle={Math.PI}
    />
  );
}

// Main exported component
export default function AngleBeamCalibrationBlock3D({
  outerRadius = 60,
  innerRadius = 40,
  height = 80,
  arcAngle = 270,
  stepCount = 5,
  stepWidth = 12,
  material = "steel",
  showDimensions = true,
  showLabels = true,
}: AngleBeamCalibrationBlock3DProps) {
  const wallThickness = outerRadius - innerRadius;

  return (
    <AngleBlock3DErrorBoundary>
      <div className="w-full h-full relative">
        <Canvas
          shadows
          camera={{ position: [120, 100, 120], fov: 50 }}
          style={{
            background: "linear-gradient(to bottom, #f8fafc, #e2e8f0)",
          }}
          frameloop="demand"
          gl={{
            antialias: true,
            powerPreference: "default",
            preserveDrawingBuffer: false,
          }}
          dpr={[1, 1.5]}
        >
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[50, 80, 50]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <directionalLight
            position={[-30, 40, -30]}
            intensity={0.5}
          />
          <pointLight position={[0, 100, 0]} intensity={0.3} />

          {/* The arc block model */}
          <ArcBlockGeometry
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            height={height}
            arcAngle={arcAngle}
            stepCount={stepCount}
            stepWidth={stepWidth}
            material={material}
            showLabels={showLabels}
          />

          {/* Controls */}
          <CameraControls />
        </Canvas>

        {/* Info panel */}
        {showDimensions && (
          <Card className="absolute top-4 left-4 w-64 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Angle Beam Calibration Block
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Outer Radius:</span>
                <Badge variant="secondary">{outerRadius} mm</Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span>Inner Radius:</span>
                <Badge variant="secondary">{innerRadius} mm</Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span>Wall Thickness:</span>
                <Badge variant="secondary">{wallThickness} mm</Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span>Height:</span>
                <Badge variant="secondary">{height} mm</Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span>Arc Angle:</span>
                <Badge variant="secondary">{arcAngle}°</Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span>Material:</span>
                <Badge variant="outline">{material.toUpperCase()}</Badge>
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground">
                <div className="font-semibold mb-1">Features:</div>
                <div>• {stepCount} stepped notches for DAC</div>
                <div>• Reference notches on surfaces</div>
                <div>• For shear wave calibration</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls help */}
        <div className="absolute top-4 right-4 space-y-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
            <div className="font-semibold mb-1">Controls:</div>
            <div>• Left click + drag: Rotate</div>
            <div>• Right click + drag: Pan</div>
            <div>• Scroll: Zoom</div>
            <div>• Hover notches: Info</div>
          </div>
        </div>
      </div>
    </AngleBlock3DErrorBoundary>
  );
}

// Also export as named export
export { AngleBeamCalibrationBlock3D };
