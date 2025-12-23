import React, { useRef, useMemo, useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame, useLoader, extend, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Grid, 
  Text,
  Html,
  PerspectiveCamera
} from '@react-three/drei';
import * as THREE from 'three';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/**
 * Error boundary for 3D viewer - prevents app crashes
 */
interface ErrorBoundaryState {
  hasError: boolean;
}

class Block3DErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('CalibrationBlock3D error caught:', error.message);
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

// Three.js extensions
extend({ OrbitControls });

// Data types
interface FBHData {
  identification: string;
  type: 'FBH';
  depth: number; // mm
  diameter: number; // mm
  notes?: string;
}

interface CalibrationBlock3DProps {
  // Block dimensions (millimeters)
  blockWidth: number;
  blockHeight: number;
  blockLength: number;

  // Hole data
  fbhData: FBHData[];

  // Material and color
  material?: 'steel' | 'aluminum' | 'titanium';

  // Block type (determines geometric shape)
  blockType?: 'flat_block' | 'curved_block' | 'cylinder_fbh' | 'cylinder_notched' | 'angle_beam' | 'iiv_block' | 'step_wedge' | 'box';

  // Display settings
  showDimensions?: boolean;
  showFBHLabels?: boolean;
  highlightedFBH?: string; // identification of the highlighted hole
}

// Hole component
function FBHHole({ 
  position, 
  depth, 
  diameter, 
  identification, 
  isHighlighted = false,
  showLabel = true 
}: {
  position: [number, number, number];
  depth: number;
  diameter: number;
  identification: string;
  isHighlighted?: boolean;
  showLabel?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      // Smooth animation for highlighted hole
      meshRef.current.scale.setScalar(
        isHighlighted || hovered ? 1.1 : 1.0
      );
    }
  });

  // Hole color based on depth
  const holeColor = useMemo(() => {
    if (isHighlighted) return '#ff6b35';
    if (depth < 25) return '#4ade80'; // Green for shallow holes
    if (depth < 100) return '#fbbf24'; // Yellow for medium holes
    return '#ef4444'; // Red for deep holes
  }, [depth, isHighlighted]);

  return (
    <group position={position}>
      {/* The hole itself */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[diameter / 2, diameter / 2, depth, 16]} />
        <meshStandardMaterial 
          color={holeColor}
          roughness={0.3}
          metalness={0.7}
          emissive={isHighlighted ? holeColor : '#000000'}
          emissiveIntensity={isHighlighted ? 0.2 : 0}
        />
      </mesh>

      {/* Hole label */}
      {showLabel && (hovered || isHighlighted) && (
        <Html distanceFactor={10}>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs pointer-events-none">
            <div className="font-semibold">{identification}</div>
            <div>Depth: {depth}mm</div>
            <div>Ø{diameter}mm</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Main block component
function CalibrationBlockGeometry({
  width,
  height,
  length,
  material = 'steel',
  blockType = 'flat_block',
  fbhData,
  highlightedFBH,
  showFBHLabels = true
}: {
  width: number;
  height: number;
  length: number;
  material: 'steel' | 'aluminum' | 'titanium';
  blockType: 'flat_block' | 'curved_block' | 'cylinder_fbh' | 'cylinder_notched' | 'angle_beam' | 'iiv_block' | 'step_wedge' | 'box';
  fbhData: FBHData[];
  highlightedFBH?: string;
  showFBHLabels: boolean;
}) {
  const blockRef = useRef<THREE.Mesh>(null);

  // Material colors
  const materialColors = {
    steel: '#8e9aaf',
    aluminum: '#c9d1d9',
    titanium: '#6b7280'
  };

  // Calculate hole positions based on block type and inspected part
  const holePositions = useMemo(() => {
    if (blockType === 'cylinder_fbh' || blockType === 'cylinder_notched') {
      // Radial holes for cylinder - position based on drilling depth
      return fbhData.map((hole, index) => {
        // Distribute around cylinder based on hole depth
        const angle = (index / Math.max(fbhData.length, 1)) * Math.PI * 2;
        const radius = Math.min(width, height) / 2;

        // Position on cylinder surface
        const x = Math.cos(angle) * radius * 0.8;
        const z = Math.sin(angle) * radius * 0.8;

        // Y position based on hole depth - deeper holes towards one end
        const depthRatio = hole.depth / Math.max(...fbhData.map(h => h.depth));
        const y = (depthRatio - 0.5) * length * 0.6;

        return {
          position: [x, y, z] as [number, number, number],
          ...hole
        };
      });
    } else {
      // Stepped holes for rectangular blocks - position based on actual depth
      return fbhData.map((hole, index) => {
        // X position - spread holes across width
        const numCols = Math.min(fbhData.length, 4);
        const col = index % numCols;
        const x = (col - (numCols - 1) / 2) * (width / (numCols + 1));

        // Y position - from top, accounting for actual hole depth
        // Holes drilled from top surface downward
        const y = height / 2 - hole.depth / 2;

        // Z position - arrange in rows if more than 4 holes
        const row = Math.floor(index / numCols);
        const numRows = Math.ceil(fbhData.length / numCols);
        const z = (row - (numRows - 1) / 2) * (length / (numRows + 1));

        return {
          position: [x, y, z] as [number, number, number],
          ...hole
        };
      });
    }
  }, [fbhData, width, height, length, blockType]);

  // Select geometry based on block type
  const renderBlockGeometry = () => {
    switch (blockType) {
      case 'cylinder_fbh':
      case 'cylinder_notched': {
        // Cylinder - use width as diameter and length as height
        const cylinderRadius = Math.min(width, height) / 2;
        return (
          <mesh ref={blockRef} receiveShadow castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[cylinderRadius, cylinderRadius, length, 32]} />
            <meshStandardMaterial
              color={materialColors[material]}
              roughness={0.4}
              metalness={0.8}
            />
          </mesh>
        );
      }

      case 'curved_block':
        // Curved block (IIW Type 2)
        return (
          <group>
            <mesh ref={blockRef} receiveShadow castShadow>
              <boxGeometry args={[width, height, length]} />
              <meshStandardMaterial
                color={materialColors[material]}
                roughness={0.4}
                metalness={0.8}
              />
            </mesh>
            {/* Curved upper surface */}
            <mesh position={[0, height / 2, 0]} receiveShadow castShadow>
              <cylinderGeometry args={[width / 2, width / 2, length, 32, 1, false, 0, Math.PI]} />
              <meshStandardMaterial
                color={materialColors[material]}
                roughness={0.4}
                metalness={0.8}
              />
            </mesh>
          </group>
        );

      case 'step_wedge':
      case 'iiv_block':
        // Stepped block
        return (
          <group>
            {/* Lower step */}
            <mesh position={[0, -height / 4, 0]} receiveShadow castShadow>
              <boxGeometry args={[width, height / 2, length]} />
              <meshStandardMaterial
                color={materialColors[material]}
                roughness={0.4}
                metalness={0.8}
              />
            </mesh>
            {/* Upper step */}
            <mesh position={[width / 4, height / 4, 0]} receiveShadow castShadow>
              <boxGeometry args={[width / 2, height / 2, length]} />
              <meshStandardMaterial
                color={materialColors[material]}
                roughness={0.4}
                metalness={0.8}
              />
            </mesh>
          </group>
        );

      case 'angle_beam':
        // Block for angle beam
        return (
          <group>
            <mesh ref={blockRef} receiveShadow castShadow>
              <boxGeometry args={[width, height, length]} />
              <meshStandardMaterial
                color={materialColors[material]}
                roughness={0.4}
                metalness={0.8}
              />
            </mesh>
            {/* Angular notch */}
            <mesh position={[0, height / 3, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[width * 0.3, height * 0.3, length * 1.1]} />
              <meshStandardMaterial
                color="#000000"
                transparent
                opacity={0.3}
              />
            </mesh>
          </group>
        );

      case 'flat_block':
      case 'box':
      default:
        // Rectangular block (IIW Type 1)
        return (
          <mesh ref={blockRef} receiveShadow castShadow>
            <boxGeometry args={[width, height, length]} />
            <meshStandardMaterial
              color={materialColors[material]}
              roughness={0.4}
              metalness={0.8}
            />
          </mesh>
        );
    }
  };

  return (
    <group>
      {/* Main block */}
      {renderBlockGeometry()}

      {/* Holes - displays only the hole selected from the table */}
      {highlightedFBH ? (
        // Show only the selected/highlighted hole
        holePositions
          .filter(hole => hole.identification === highlightedFBH)
          .map((hole) => (
            <FBHHole
              key={hole.identification}
              position={hole.position}
              depth={hole.depth}
              diameter={hole.diameter}
              identification={hole.identification}
              isHighlighted={true}
              showLabel={showFBHLabels}
            />
          ))
      ) : (
        // Show all holes when none is selected (for overview)
        holePositions.slice(0, 3).map((hole) => (
          <FBHHole
            key={hole.identification}
            position={hole.position}
            depth={hole.depth}
            diameter={hole.diameter}
            identification={hole.identification}
            isHighlighted={false}
            showLabel={false}
          />
        ))
      )}

      {/* Coordinate grid */}
      <Grid 
        args={[200, 200]} 
        position={[0, -height/2 - 10, 0]}
        cellColor="#6b7280"
        sectionColor="#374151"
        fadeDistance={150}
        fadeStrength={1}
      />
    </group>
  );
}

// Camera and controls component
function CameraControls() {
  const { camera, gl } = useThree();
  
  return (
    <OrbitControls
      args={[camera, gl.domElement]}
      enableDamping
      dampingFactor={0.05}
      minDistance={50}
      maxDistance={500}
      maxPolarAngle={Math.PI / 2}
    />
  );
}

// Main component
export default function CalibrationBlock3D({
  blockWidth = 150,
  blockHeight = 50,
  blockLength = 100,
  fbhData = [],
  material = 'steel',
  blockType = 'flat_block',
  showDimensions = true,
  showFBHLabels = true,
  highlightedFBH
}: CalibrationBlock3DProps) {

  return (
    <Block3DErrorBoundary>
      <div className="w-full h-full relative">
        {/* 3D Canvas display */}
        <Canvas
          shadows
          camera={{ position: [100, 100, 100], fov: 50 }}
          style={{ background: 'linear-gradient(to bottom, #f8fafc, #e2e8f0)' }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        {/* Environment – "warehouse" preset removed because remote HDR returns 404 and caused crashes */}
        {/* ContactShadows removed to prevent crashes */}

        {/* The model */}
        <CalibrationBlockGeometry
          width={blockWidth}
          height={blockHeight}
          length={blockLength}
          material={material}
          blockType={blockType || 'flat_block'}
          fbhData={fbhData}
          highlightedFBH={highlightedFBH}
          showFBHLabels={showFBHLabels}
        />

        {/* Controls */}
        <CameraControls />
      </Canvas>

      {/* Information panel */}
      {showDimensions && (
        <Card className="absolute top-4 left-4 w-64 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Block Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Dimensions:</span>
              <Badge variant="secondary">
                {blockWidth}×{blockHeight}×{blockLength}mm
              </Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span>Material:</span>
              <Badge variant="outline">{material.toUpperCase()}</Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span>FBH Holes:</span>
              <Badge>{fbhData.length}</Badge>
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground">
              • Green: Shallow holes (&lt;25mm)
              <br />
              • Yellow: Medium holes (25-100mm)  
              <br />
              • Red: Deep holes (&gt;100mm)
            </div>
          </CardContent>
        </Card>
      )}

      {/* Display controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
          <div className="font-semibold mb-1">Controls:</div>
          <div>• Left click + drag: Rotate</div>
          <div>• Right click + drag: Pan</div>
          <div>• Scroll: Zoom</div>
          <div>• Hover holes: Info</div>
        </div>
      </div>
      </div>
    </Block3DErrorBoundary>
  );
}