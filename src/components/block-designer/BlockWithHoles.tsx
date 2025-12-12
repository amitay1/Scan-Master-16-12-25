/**
 * Block With Holes Component
 * Uses CSG to subtract holes from the block geometry
 * Creates actual holes in the 3D model
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import {
  CustomBlockShape,
  DesignerHole,
  HoleSurface,
} from '@/types/blockDesigner.types';

interface BlockWithHolesProps {
  blockShape: CustomBlockShape;
  holes: DesignerHole[];
  color: string;
}

// Create base geometry based on block shape
function createBaseGeometry(blockShape: CustomBlockShape): THREE.BufferGeometry {
  const { geometryType, length, width, height, outerDiameter, innerDiameter, cylinderLength, topCurvature } = blockShape;

  // Cylinder or tube
  if (geometryType === 'cylinder' || geometryType === 'tube') {
    const outerRadius = outerDiameter / 2;
    const segments = 64;

    if (geometryType === 'tube' && innerDiameter > 0) {
      // Create tube using LatheGeometry for proper CSG-compatible watertight geometry
      const innerRadius = innerDiameter / 2;
      const halfLength = cylinderLength / 2;

      // Create cross-section profile (a rectangle that will be revolved)
      // Profile goes: inner-bottom -> outer-bottom -> outer-top -> inner-top -> back to inner-bottom
      const points: THREE.Vector2[] = [
        new THREE.Vector2(innerRadius, -halfLength),  // Inner bottom
        new THREE.Vector2(outerRadius, -halfLength),  // Outer bottom
        new THREE.Vector2(outerRadius, halfLength),   // Outer top
        new THREE.Vector2(innerRadius, halfLength),   // Inner top
      ];

      // LatheGeometry creates geometry by revolving a 2D shape around Y axis
      const tubeGeo = new THREE.LatheGeometry(points, segments);

      // Rotate to lie along X axis (LatheGeometry creates along Y by default)
      tubeGeo.rotateZ(Math.PI / 2);
      tubeGeo.computeVertexNormals();

      return tubeGeo;
    }

    // Solid cylinder
    const geo = new THREE.CylinderGeometry(outerRadius, outerRadius, cylinderLength, segments);
    geo.rotateZ(Math.PI / 2); // Lie along X axis
    return geo;
  }

  // Curved block
  if (topCurvature.type !== 'flat') {
    const segmentsX = 32;
    const segmentsZ = 16;
    const geo = new THREE.BufferGeometry();

    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    const halfLength = length / 2;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const curveHeight = topCurvature.type === 'convex'
      ? Math.min(height * 0.25, topCurvature.radius * 0.15)
      : -Math.min(height * 0.15, topCurvature.radius * 0.1);

    // Top surface
    for (let iz = 0; iz <= segmentsZ; iz++) {
      const tz = iz / segmentsZ;
      const z = (tz - 0.5) * width;

      for (let ix = 0; ix <= segmentsX; ix++) {
        const tx = ix / segmentsX;
        const x = (tx - 0.5) * length;
        const normalizedX = (tx - 0.5) * 2;
        const curve = curveHeight * (1 - normalizedX * normalizedX);
        const y = halfHeight + curve;

        positions.push(x, y, z);

        const dx = -2 * curveHeight * normalizedX / length;
        const normal = new THREE.Vector3(-dx, 1, 0).normalize();
        normals.push(normal.x, normal.y, normal.z);
      }
    }

    for (let iz = 0; iz < segmentsZ; iz++) {
      for (let ix = 0; ix < segmentsX; ix++) {
        const a = iz * (segmentsX + 1) + ix;
        const b = a + 1;
        const c = a + (segmentsX + 1);
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    // Bottom surface
    const bottomOffset = positions.length / 3;
    for (let iz = 0; iz <= segmentsZ; iz++) {
      const z = ((iz / segmentsZ) - 0.5) * width;
      for (let ix = 0; ix <= segmentsX; ix++) {
        const x = ((ix / segmentsX) - 0.5) * length;
        positions.push(x, -halfHeight, z);
        normals.push(0, -1, 0);
      }
    }

    for (let iz = 0; iz < segmentsZ; iz++) {
      for (let ix = 0; ix < segmentsX; ix++) {
        const a = bottomOffset + iz * (segmentsX + 1) + ix;
        const b = a + 1;
        const c = a + (segmentsX + 1);
        const d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }

    // Front face
    const frontOffset = positions.length / 3;
    for (let ix = 0; ix <= segmentsX; ix++) {
      const tx = ix / segmentsX;
      const x = (tx - 0.5) * length;
      const normalizedX = (tx - 0.5) * 2;
      const curve = curveHeight * (1 - normalizedX * normalizedX);

      positions.push(x, halfHeight + curve, halfWidth);
      normals.push(0, 0, 1);
      positions.push(x, -halfHeight, halfWidth);
      normals.push(0, 0, 1);
    }

    for (let ix = 0; ix < segmentsX; ix++) {
      const a = frontOffset + ix * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, b, c, b, d, c);
    }

    // Back face
    const backOffset = positions.length / 3;
    for (let ix = 0; ix <= segmentsX; ix++) {
      const tx = ix / segmentsX;
      const x = (tx - 0.5) * length;
      const normalizedX = (tx - 0.5) * 2;
      const curve = curveHeight * (1 - normalizedX * normalizedX);

      positions.push(x, halfHeight + curve, -halfWidth);
      normals.push(0, 0, -1);
      positions.push(x, -halfHeight, -halfWidth);
      normals.push(0, 0, -1);
    }

    for (let ix = 0; ix < segmentsX; ix++) {
      const a = backOffset + ix * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, c, b, b, c, d);
    }

    // Side faces
    const leftOffset = positions.length / 3;
    positions.push(-halfLength, halfHeight + curveHeight, halfWidth);
    positions.push(-halfLength, -halfHeight, halfWidth);
    positions.push(-halfLength, halfHeight + curveHeight, -halfWidth);
    positions.push(-halfLength, -halfHeight, -halfWidth);
    for (let i = 0; i < 4; i++) normals.push(-1, 0, 0);
    indices.push(leftOffset, leftOffset + 1, leftOffset + 2);
    indices.push(leftOffset + 1, leftOffset + 3, leftOffset + 2);

    const rightOffset = positions.length / 3;
    positions.push(halfLength, halfHeight + curveHeight, halfWidth);
    positions.push(halfLength, -halfHeight, halfWidth);
    positions.push(halfLength, halfHeight + curveHeight, -halfWidth);
    positions.push(halfLength, -halfHeight, -halfWidth);
    for (let i = 0; i < 4; i++) normals.push(1, 0, 0);
    indices.push(rightOffset, rightOffset + 2, rightOffset + 1);
    indices.push(rightOffset + 1, rightOffset + 2, rightOffset + 3);

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }

  // Default: simple box
  return new THREE.BoxGeometry(length, height, width);
}

// Calculate hole position and rotation for CSG
function getHoleTransform(
  hole: DesignerHole,
  blockShape: CustomBlockShape
): { position: THREE.Vector3; rotation: THREE.Euler } {
  const isCylindrical = blockShape.geometryType === 'cylinder' || blockShape.geometryType === 'tube';

  let position: THREE.Vector3;
  let rotation: THREE.Euler;

  if (isCylindrical) {
    // For cylinders/tubes: cylinder lies along X axis, centered at origin
    // hole.position.x = position along cylinder length (0 to cylinderLength)
    const halfLength = blockShape.cylinderLength / 2;
    const radius = blockShape.outerDiameter / 2;

    // Hole drilled radially from top (Y direction) into the cylinder
    position = new THREE.Vector3(
      hole.position.x - halfLength, // Position along cylinder
      radius - hole.depth / 2,       // Start at top surface, go inward
      0                              // Center of cylinder
    );
    rotation = new THREE.Euler(0, 0, 0); // Cylinder along Y axis (drilled downward)
  } else {
    // Rectangular/curved block positioning
    const { length, width, height } = blockShape;
    const halfLength = length / 2;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    switch (hole.surface) {
      case 'top':
        position = new THREE.Vector3(
          hole.position.x - halfLength,
          halfHeight - hole.depth / 2,
          hole.position.y - halfWidth
        );
        rotation = new THREE.Euler(0, 0, 0);
        break;
      case 'bottom':
        position = new THREE.Vector3(
          hole.position.x - halfLength,
          -halfHeight + hole.depth / 2,
          hole.position.y - halfWidth
        );
        rotation = new THREE.Euler(0, 0, 0);
        break;
      case 'front':
        position = new THREE.Vector3(
          hole.position.x - halfLength,
          hole.position.y - halfHeight,
          halfWidth - hole.depth / 2
        );
        rotation = new THREE.Euler(Math.PI / 2, 0, 0);
        break;
      case 'back':
        position = new THREE.Vector3(
          hole.position.x - halfLength,
          hole.position.y - halfHeight,
          -halfWidth + hole.depth / 2
        );
        rotation = new THREE.Euler(Math.PI / 2, 0, 0);
        break;
      case 'left':
        position = new THREE.Vector3(
          -halfLength + hole.depth / 2,
          hole.position.y - halfHeight,
          hole.position.x - halfWidth
        );
        rotation = new THREE.Euler(0, 0, Math.PI / 2);
        break;
      case 'right':
        position = new THREE.Vector3(
          halfLength - hole.depth / 2,
          hole.position.y - halfHeight,
          hole.position.x - halfWidth
        );
        rotation = new THREE.Euler(0, 0, Math.PI / 2);
        break;
      default:
        position = new THREE.Vector3(0, halfHeight - hole.depth / 2, 0);
        rotation = new THREE.Euler(0, 0, 0);
    }
  }

  return { position, rotation };
}

// Perform CSG subtraction safely
function subtractHoleFromBlock(
  blockMesh: THREE.Mesh,
  holeGeometry: THREE.BufferGeometry,
  position: THREE.Vector3,
  rotation: THREE.Euler
): THREE.Mesh {
  try {
    const holeMesh = new THREE.Mesh(holeGeometry, new THREE.MeshStandardMaterial());
    holeMesh.position.copy(position);
    holeMesh.rotation.copy(rotation);
    holeMesh.updateMatrix();

    blockMesh.updateMatrix();

    const result = CSG.subtract(blockMesh, holeMesh);
    return result;
  } catch (error) {
    console.warn('CSG subtraction failed:', error);
    return blockMesh;
  }
}

export function BlockWithHoles({ blockShape, holes, color }: BlockWithHolesProps) {
  // Create the geometry with holes cut out
  const geometry = useMemo(() => {
    // Create base block geometry
    const baseGeo = createBaseGeometry(blockShape);

    // If no holes, return base geometry
    if (holes.length === 0) {
      return baseGeo;
    }

    // For performance, limit CSG operations
    const maxHolesForCSG = 10;
    const holesToProcess = holes.slice(0, maxHolesForCSG);

    // Create mesh for CSG operations
    let blockMesh: THREE.Mesh = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial());

    // Subtract each hole
    for (const hole of holesToProcess) {
      // Create hole cylinder geometry (slightly longer to ensure clean cut)
      const holeGeo = new THREE.CylinderGeometry(
        hole.diameter / 2,
        hole.diameter / 2,
        hole.depth + 2, // Extra length for clean cut
        32
      );

      const { position, rotation } = getHoleTransform(hole, blockShape);

      // Perform CSG subtraction
      blockMesh = subtractHoleFromBlock(blockMesh, holeGeo, position, rotation);
    }

    // Get the resulting geometry
    if (blockMesh.geometry) {
      blockMesh.geometry.computeVertexNormals();
      return blockMesh.geometry;
    }

    return baseGeo;
  }, [blockShape, holes]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        roughness={0.35}
        metalness={0.75}
        envMapIntensity={0.8}
      />
    </mesh>
  );
}
