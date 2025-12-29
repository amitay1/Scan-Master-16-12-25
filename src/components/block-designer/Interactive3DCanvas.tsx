/**
 * Interactive 3D Canvas
 * Three.js canvas with click-to-place holes and interactive controls
 */

import React, { useRef, useMemo, useCallback, useState, Component, ErrorInfo, ReactNode } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useBlockDesigner } from '@/contexts/BlockDesignerContext';
import { BlockWithHoles } from './BlockWithHoles';
import {
  DesignerHole,
  DEFAULT_HOLE,
  DEFAULT_SDH,
  fbhSizeToDiameter,
  MATERIAL_PROPERTIES,
  HoleSurface,
  CustomBlockShape,
} from '@/types/blockDesigner.types';

/**
 * Error boundary for 3D canvas - prevents app crashes
 */
interface ErrorBoundaryState {
  hasError: boolean;
}

class Canvas3DErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('3D Canvas error caught:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 text-slate-400">
          <div className="text-center">
            <p className="text-lg font-medium">3D Preview unavailable</p>
            <p className="text-sm mt-2">Please refresh the page</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Hole marker component - shows hole on the block surface
function HoleMarker({
  hole,
  blockShape,
  isSelected,
  onSelect,
}: {
  hole: DesignerHole;
  blockShape: CustomBlockShape;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isCylindrical = blockShape.geometryType === 'cylinder' || blockShape.geometryType === 'tube';

  // Calculate position based on surface - hole drilled FROM the surface INTO the block
  const { position, rotation } = useMemo(() => {
    let pos: [number, number, number];
    let rot: [number, number, number] = [0, 0, 0];

    if (isCylindrical) {
      // For cylinders/tubes: cylinder lies along X axis
      // hole.position.x = position along cylinder length (0 to cylinderLength)
      const halfLength = blockShape.cylinderLength / 2;
      const radius = blockShape.outerDiameter / 2;

      // Hole is drilled radially from outside, at the top of the cylinder
      // Position: x along length, y at top (radius - depth/2), z at center (0)
      pos = [
        hole.position.x - halfLength, // Position along cylinder
        radius - hole.depth / 2,       // Start at top surface, go inward
        0,                             // Center of cylinder
      ];
      rot = [0, 0, 0]; // Cylinder along Y axis (drilled downward)
    } else {
      // Rectangular/curved block positioning
      const halfLength = blockShape.length / 2;
      const halfWidth = blockShape.width / 2;
      const halfHeight = blockShape.height / 2;

      switch (hole.surface) {
        case 'top':
          // Hole drilled from top down
          pos = [
            hole.position.x - halfLength,
            halfHeight - hole.depth / 2, // Start at top, go down
            hole.position.y - halfWidth,
          ];
          rot = [0, 0, 0]; // Cylinder along Y axis
          break;
        case 'bottom':
          pos = [
            hole.position.x - halfLength,
            -halfHeight + hole.depth / 2,
            hole.position.y - halfWidth,
          ];
          rot = [0, 0, 0];
          break;
        case 'front':
          pos = [
            hole.position.x - halfLength,
            hole.position.y - halfHeight,
            halfWidth - hole.depth / 2,
          ];
          rot = [Math.PI / 2, 0, 0]; // Rotate to drill along Z
          break;
        case 'back':
          pos = [
            hole.position.x - halfLength,
            hole.position.y - halfHeight,
            -halfWidth + hole.depth / 2,
          ];
          rot = [Math.PI / 2, 0, 0];
          break;
        case 'left':
          pos = [
            -halfLength + hole.depth / 2,
            hole.position.y - halfHeight,
            hole.position.x - halfWidth,
          ];
          rot = [0, 0, Math.PI / 2]; // Rotate to drill along X
          break;
        case 'right':
          pos = [
            halfLength - hole.depth / 2,
            hole.position.y - halfHeight,
            hole.position.x - halfWidth,
          ];
          rot = [0, 0, Math.PI / 2];
          break;
        default:
          pos = [0, halfHeight - hole.depth / 2, 0];
          rot = [0, 0, 0];
      }
    }

    return { position: pos, rotation: rot };
  }, [hole, blockShape, isCylindrical]);

  // Hole color based on selection/type/depth
  const color = useMemo(() => {
    if (isSelected) return '#ff6b35';
    if (hovered) return '#60a5fa';
    // SDH holes are orange
    if (hole.type === 'sdh') return '#f97316';
    // Through holes are purple
    if (hole.type === 'through') return '#a855f7';
    // FBH depth-based colors
    if (hole.depth < 25) return '#22c55e';
    if (hole.depth < 100) return '#eab308';
    return '#ef4444';
  }, [hole.depth, hole.type, isSelected, hovered]);

  return (
    <group position={position} rotation={rotation}>
      {/* Invisible click area for hole selection */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        visible={false}
      >
        <cylinderGeometry args={[hole.diameter / 2 + 2, hole.diameter / 2 + 2, hole.depth + 4, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Surface marker ring - visible when selected or hovered */}
      {(isSelected || hovered) && (
        <mesh position={[0, hole.depth / 2 + 0.5, 0]}>
          <torusGeometry args={[hole.diameter / 2 + 2, 0.8, 8, 24]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isSelected ? 0.6 : 0.3}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Label on hover/select */}
      {(hovered || isSelected) && (
        <Html distanceFactor={8} position={[0, hole.depth / 2 + 15, 0]}>
          <div className="bg-black/90 text-white px-3 py-2 rounded-lg text-xs pointer-events-none whitespace-nowrap shadow-lg">
            <div className="font-bold text-sm">
              {hole.type === 'sdh' ? `SDH ⌀${hole.diameter}mm` :
               hole.type === 'through' ? `Through ⌀${hole.diameter}mm` :
               `${hole.size}" FBH`}
            </div>
            <div className="text-gray-300">Diameter: {hole.diameter.toFixed(2)}mm</div>
            {hole.type === 'sdh' && hole.depthFromSurface !== undefined && (
              <div className="text-gray-300">From surface: {hole.depthFromSurface}mm</div>
            )}
            <div className="text-gray-300">{hole.type === 'sdh' ? 'Length' : 'Depth'}: {hole.depth}mm</div>
            <div className="text-gray-300">Surface: {hole.surface}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// The actual block mesh with CSG holes that receives clicks
function InteractiveBlock({
  blockShape,
  holes,
  color,
  onPlaceHole,
}: {
  blockShape: CustomBlockShape;
  holes: DesignerHole[];
  color: string;
  onPlaceHole: (position: { x: number; y: number; z: number }, surface: HoleSurface) => void;
}) {
  const { interactionMode } = useBlockDesigner();
  const isCylindrical = blockShape.geometryType === 'cylinder' || blockShape.geometryType === 'tube';

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (interactionMode !== 'place') return;
      event.stopPropagation();

      const point = event.point;
      const normal = event.face?.normal;

      // Determine which surface was clicked
      let surface: HoleSurface = 'top';
      if (normal) {
        const absX = Math.abs(normal.x);
        const absY = Math.abs(normal.y);
        const absZ = Math.abs(normal.z);

        if (absY >= absX && absY >= absZ) {
          surface = normal.y > 0 ? 'top' : 'bottom';
        } else if (absZ >= absX && absZ >= absY) {
          surface = normal.z > 0 ? 'front' : 'back';
        } else {
          surface = normal.x > 0 ? 'right' : 'left';
        }
      }

      let localPos: { x: number; y: number; z: number };

      if (isCylindrical) {
        // For cylinders/tubes: cylinder lies along X axis, centered at origin
        // point.x = position along cylinder (-cylinderLength/2 to +cylinderLength/2)
        // point.y, point.z = radial position
        const halfLength = blockShape.cylinderLength / 2;
        const radius = blockShape.outerDiameter / 2;

        // Convert to local coordinates (0 to cylinderLength for x)
        localPos = {
          x: point.x + halfLength, // Position along cylinder length (0 to cylinderLength)
          y: 0, // For cylindrical, we don't use y for positioning (could be angular later)
          z: blockShape.outerDiameter, // Depth reference (wall thickness)
        };

        // Clamp x to valid range
        localPos.x = Math.max(5, Math.min(blockShape.cylinderLength - 5, localPos.x));

        // For cylinders, always use 'top' surface (drilled radially from outside)
        surface = 'top';
      } else {
        // Rectangular/curved block: Convert world point to block-local coordinates (0 to dimension range)
        const halfLength = blockShape.length / 2;
        const halfWidth = blockShape.width / 2;
        const halfHeight = blockShape.height / 2;

        switch (surface) {
          case 'top':
          case 'bottom':
            localPos = {
              x: point.x + halfLength,
              y: point.z + halfWidth,
              z: blockShape.height,
            };
            break;
          case 'front':
          case 'back':
            localPos = {
              x: point.x + halfLength,
              y: point.y + halfHeight,
              z: blockShape.width,
            };
            break;
          case 'left':
          case 'right':
            localPos = {
              x: point.z + halfWidth,
              y: point.y + halfHeight,
              z: blockShape.length,
            };
            break;
          default:
            localPos = {
              x: point.x + halfLength,
              y: point.z + halfWidth,
              z: blockShape.height,
            };
        }

        // Clamp to valid range
        localPos.x = Math.max(5, Math.min(blockShape.length - 5, localPos.x));
        localPos.y = Math.max(5, Math.min(blockShape.width - 5, localPos.y));
      }

      onPlaceHole(localPos, surface);
    },
    [interactionMode, blockShape, onPlaceHole, isCylindrical]
  );

  return (
    <group onClick={handleClick}>
      <BlockWithHoles blockShape={blockShape} holes={holes} color={color} />
    </group>
  );
}

// Scene content
function SceneContent() {
  const {
    blockShape,
    blockMaterial,
    holes,
    selectedHoleId,
    selectHole,
    addHole,
    placementMode,
  } = useBlockDesigner();

  const isCylindrical = blockShape.geometryType === 'cylinder' || blockShape.geometryType === 'tube';

  const handlePlaceHole = useCallback(
    (position: { x: number; y: number; z: number }, surface: HoleSurface) => {
      // Calculate default depth based on geometry type and placement mode
      let defaultDepth: number;
      if (isCylindrical) {
        const wallThickness = blockShape.geometryType === 'tube'
          ? (blockShape.outerDiameter - blockShape.innerDiameter) / 2
          : blockShape.outerDiameter / 2;
        defaultDepth = Math.min(25, wallThickness * 0.8);
      } else {
        defaultDepth = Math.min(25, blockShape.height * 0.8);
      }

      // Create hole based on placement mode
      if (placementMode === 'sdh') {
        // SDH - Side Drilled Hole
        addHole({
          ...DEFAULT_SDH,
          type: 'sdh',
          position: {
            x: position.x,
            y: 0, // SDH runs full width
            z: position.z || blockShape.height / 2,
          },
          depthFromSurface: position.z || blockShape.height / 2,
          depth: blockShape.width, // SDH length = block width
          surface: 'left',
        });
      } else {
        // FBH - Flat Bottom Hole (default)
        addHole({
          ...DEFAULT_HOLE,
          type: 'fbh',
          diameter: fbhSizeToDiameter(DEFAULT_HOLE.size),
          depth: defaultDepth,
          position,
          surface,
        });
      }
    },
    [addHole, blockShape.height, blockShape.width, blockShape.outerDiameter, blockShape.innerDiameter, blockShape.geometryType, isCylindrical, placementMode]
  );

  const materialColor = MATERIAL_PROPERTIES[blockMaterial].color;

  // Calculate grid position based on geometry
  const gridYPosition = useMemo(() => {
    if (isCylindrical) {
      return -blockShape.outerDiameter / 2 - 1;
    }
    return -blockShape.height / 2 - 1;
  }, [isCylindrical, blockShape.outerDiameter, blockShape.height]);

  return (
    <>
      {/* Better lighting from multiple angles */}
      <ambientLight intensity={0.6} />

      {/* Main light from top-front-right */}
      <directionalLight
        position={[100, 150, 100]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Fill light from opposite side */}
      <directionalLight
        position={[-100, 100, -100]}
        intensity={0.6}
      />

      {/* Bottom fill to see underside */}
      <directionalLight
        position={[0, -50, 0]}
        intensity={0.3}
      />

      {/* Front fill */}
      <pointLight position={[0, 50, 150]} intensity={0.4} />

      {/* Back fill */}
      <pointLight position={[0, 50, -150]} intensity={0.4} />

      {/* Environment preset removed - external HDRI violates CSP. Using local lights for reflections */}
      <hemisphereLight args={['#ffffff', '#444444', 0.6]} />

      {/* The block with CSG holes - centered at origin */}
      <group>
        <InteractiveBlock
          blockShape={blockShape}
          holes={holes}
          color={materialColor}
          onPlaceHole={handlePlaceHole}
        />

        {/* Hole markers for selection and labels */}
        {holes.map((hole) => (
          <HoleMarker
            key={hole.id}
            hole={hole}
            blockShape={blockShape}
            isSelected={selectedHoleId === hole.id}
            onSelect={() => selectHole(hole.id)}
          />
        ))}
      </group>

      {/* Grid on floor */}
      <Grid
        args={[400, 400]}
        position={[0, gridYPosition, 0]}
        cellColor="#9ca3af"
        sectionColor="#6b7280"
        cellSize={10}
        sectionSize={50}
        fadeDistance={300}
        fadeStrength={1}
      />

      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={50}
        maxDistance={800}
        target={[0, 0, 0]}
      />
    </>
  );
}

export function Interactive3DCanvas() {
  const { blockShape, interactionMode, placementMode } = useBlockDesigner();

  // Check if the geometry is cylindrical
  const isCylindrical = blockShape.geometryType === 'cylinder' || blockShape.geometryType === 'tube';

  // Calculate camera position based on block size
  const cameraPosition = useMemo(() => {
    let maxDim: number;
    if (isCylindrical) {
      maxDim = Math.max(blockShape.outerDiameter, blockShape.cylinderLength);
    } else {
      maxDim = Math.max(blockShape.length, blockShape.width, blockShape.height);
    }
    const dist = maxDim * 2;
    return [dist, dist * 0.8, dist] as [number, number, number];
  }, [isCylindrical, blockShape.length, blockShape.width, blockShape.height, blockShape.outerDiameter, blockShape.cylinderLength]);

  return (
    <Canvas3DErrorBoundary>
      <div className="w-full h-full relative bg-gradient-to-b from-slate-800 to-slate-900">
        <Canvas
          shadows
          camera={{ position: cameraPosition, fov: 45, near: 1, far: 2000 }}
          style={{
            cursor: interactionMode === 'place' ? 'crosshair' : 'grab',
          }}
          frameloop="demand"
          gl={{
            antialias: true,
            powerPreference: 'default',
            preserveDrawingBuffer: false,
          }}
          dpr={[1, 1.5]}
        >
          <SceneContent />
        </Canvas>

        {/* Interaction mode indicator */}
        <div className="absolute bottom-4 left-4 bg-slate-800/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-slate-700">
          <span className={`font-medium ${interactionMode === 'place' ? 'text-green-400' : 'text-slate-300'}`}>
            {interactionMode === 'place'
              ? placementMode === 'sdh'
                ? 'Click on block to place SDH'
                : placementMode === 'notch'
                ? 'Click on edge to place notch'
                : 'Click on block to place FBH'
              : 'Select mode - click features to select'}
          </span>
        </div>

        {/* Controls help */}
        <div className="absolute top-4 right-4 bg-slate-800/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-slate-700 text-xs">
          <div className="font-bold mb-2 text-slate-200">Controls:</div>
          <div className="text-slate-400">Left drag: Rotate</div>
          <div className="text-slate-400">Right drag: Pan</div>
          <div className="text-slate-400">Scroll: Zoom</div>
        </div>
      </div>
    </Canvas3DErrorBoundary>
  );
}
