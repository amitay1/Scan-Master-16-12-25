/**
 * Custom Block Mesh
 * Parametric 3D geometry for custom calibration blocks with curvature
 * Supports: rectangular, curved_block, cylinder, tube, iiw_block geometries
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { CustomBlockShape, RadiusSurface } from '@/types/blockDesigner.types';

interface CustomBlockMeshProps {
  blockShape: CustomBlockShape;
  color: string;
}

// Create cylinder geometry (solid or tube)
function createCylinderGeometry(
  outerDiameter: number,
  innerDiameter: number,
  cylinderLength: number
): THREE.BufferGeometry {
  const outerRadius = outerDiameter / 2;
  const segments = 64;

  if (innerDiameter <= 0) {
    // Solid cylinder - lying horizontally along X axis
    const geo = new THREE.CylinderGeometry(outerRadius, outerRadius, cylinderLength, segments);
    // Rotate to lie along X axis
    geo.rotateZ(Math.PI / 2);
    return geo;
  }

  // Create tube using LatheGeometry for proper watertight geometry
  const innerRadius = innerDiameter / 2;
  const halfLength = cylinderLength / 2;

  // Create cross-section profile (a rectangle that will be revolved)
  const points: THREE.Vector2[] = [
    new THREE.Vector2(innerRadius, -halfLength),  // Inner bottom
    new THREE.Vector2(outerRadius, -halfLength),  // Outer bottom
    new THREE.Vector2(outerRadius, halfLength),   // Outer top
    new THREE.Vector2(innerRadius, halfLength),   // Inner top
  ];

  // LatheGeometry creates geometry by revolving a 2D shape around Y axis
  const tubeGeo = new THREE.LatheGeometry(points, segments);

  // Rotate to lie along X axis
  tubeGeo.rotateZ(Math.PI / 2);
  tubeGeo.computeVertexNormals();

  return tubeGeo;
}

/**
 * Create IIW-style block geometry with quadrant radius end(s)
 * IIW blocks have a curved quarter-circle section at one or both ends
 * The radius surface creates the characteristic angle beam calibration shape
 */
function createIIWBlockGeometry(
  length: number,
  width: number,
  height: number,
  radiusSurface: RadiusSurface
): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const halfWidth = width / 2;
  const radius = radiusSurface.radius;
  const hasLeftRadius = radiusSurface.position === 'left' || radiusSurface.position === 'both';
  const hasRightRadius = radiusSurface.position === 'right' || radiusSurface.position === 'both';

  // For IIW block: the radius creates a quarter circle from bottom to a height equal to radius
  // The rest of the block extends as a rectangular section
  // Block origin is at center

  // Calculate the rectangular and curved portions
  // If radius > height, the curve takes the full height
  const effectiveRadius = Math.min(radius, height);
  const curveSegments = 24;

  // Helper to add a vertex
  const addVertex = (x: number, y: number, z: number, nx: number, ny: number, nz: number) => {
    positions.push(x, y, z);
    normals.push(nx, ny, nz);
    return positions.length / 3 - 1;
  };

  // Helper to add a quad (two triangles)
  const addQuad = (a: number, b: number, c: number, d: number) => {
    indices.push(a, b, c);
    indices.push(b, d, c);
  };

  // Build the IIW block profile
  // The block has:
  // - Flat bottom
  // - Left end: either flat or curved radius
  // - Right end: either flat or curved radius
  // - Top surface connecting the ends

  // We'll build this by creating front and back face outlines, then connecting them

  // Generate 2D profile points for front face (z = +halfWidth)
  // and back face (z = -halfWidth)
  const generateProfile = (): THREE.Vector2[] => {
    const profile: THREE.Vector2[] = [];

    // Start from bottom-left
    if (hasLeftRadius) {
      // Left side has radius - start from center of radius arc
      const centerX = -length / 2 + radius;
      const centerY = 0;

      // Generate quarter circle from bottom (pointing left) to top (pointing up)
      for (let i = 0; i <= curveSegments; i++) {
        const angle = Math.PI + (Math.PI / 2) * (i / curveSegments); // PI to 3PI/2
        const x = centerX + Math.cos(angle) * effectiveRadius;
        const y = centerY + Math.sin(angle) * effectiveRadius;
        profile.push(new THREE.Vector2(x, y));
      }

      // If height > radius, add straight section going up
      if (height > effectiveRadius) {
        profile.push(new THREE.Vector2(-length / 2 + radius, height - effectiveRadius));
      }
    } else {
      // Flat left end
      profile.push(new THREE.Vector2(-length / 2, 0));
      profile.push(new THREE.Vector2(-length / 2, height));
    }

    // Top edge (left to right)
    if (hasRightRadius) {
      if (height > effectiveRadius) {
        profile.push(new THREE.Vector2(length / 2 - radius, height));
      }

      // Right side has radius
      const centerX = length / 2 - radius;
      const centerY = 0;

      // Generate quarter circle from top to bottom
      for (let i = 0; i <= curveSegments; i++) {
        const angle = (3 * Math.PI / 2) + (Math.PI / 2) * (i / curveSegments); // 3PI/2 to 2PI
        const x = centerX + Math.cos(angle) * effectiveRadius;
        const y = centerY + Math.sin(angle) * effectiveRadius;
        profile.push(new THREE.Vector2(x, y));
      }
    } else {
      // Flat right end
      profile.push(new THREE.Vector2(length / 2, height));
      profile.push(new THREE.Vector2(length / 2, 0));
    }

    return profile;
  };

  const profile = generateProfile();

  // Create front face (z = +halfWidth) - filled polygon
  const frontVertStart = positions.length / 3;
  for (const pt of profile) {
    addVertex(pt.x, pt.y, halfWidth, 0, 0, 1);
  }

  // Triangulate the front face (fan from first vertex)
  for (let i = 1; i < profile.length - 1; i++) {
    indices.push(frontVertStart, frontVertStart + i, frontVertStart + i + 1);
  }

  // Create back face (z = -halfWidth) - filled polygon
  const backVertStart = positions.length / 3;
  for (const pt of profile) {
    addVertex(pt.x, pt.y, -halfWidth, 0, 0, -1);
  }

  // Triangulate the back face (reversed winding)
  for (let i = 1; i < profile.length - 1; i++) {
    indices.push(backVertStart, backVertStart + i + 1, backVertStart + i);
  }

  // Create side walls connecting front and back
  // Each edge of the profile becomes a quad
  for (let i = 0; i < profile.length; i++) {
    const nextI = (i + 1) % profile.length;
    const p0 = profile[i];
    const p1 = profile[nextI];

    // Calculate edge direction and normal (pointing outward)
    const edgeDir = new THREE.Vector2(p1.x - p0.x, p1.y - p0.y).normalize();
    const normal2D = new THREE.Vector2(-edgeDir.y, edgeDir.x); // perpendicular

    // Four corners of the quad
    const a = addVertex(p0.x, p0.y, halfWidth, normal2D.x, normal2D.y, 0);
    const b = addVertex(p0.x, p0.y, -halfWidth, normal2D.x, normal2D.y, 0);
    const c = addVertex(p1.x, p1.y, halfWidth, normal2D.x, normal2D.y, 0);
    const d = addVertex(p1.x, p1.y, -halfWidth, normal2D.x, normal2D.y, 0);

    addQuad(a, b, c, d);
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  return geo;
}

export function CustomBlockMesh({ blockShape, color }: CustomBlockMeshProps) {
  const { geometryType, length, width, height, outerDiameter, innerDiameter, cylinderLength, topCurvature, frontCurvature, cornerRadius, radiusSurface } = blockShape;

  // Create the geometry based on geometry type and curvature settings
  const geometry = useMemo(() => {
    // Handle cylinder and tube geometries
    if (geometryType === 'cylinder' || geometryType === 'tube') {
      return createCylinderGeometry(outerDiameter, geometryType === 'tube' ? innerDiameter : 0, cylinderLength);
    }

    // Handle IIW-style blocks with radius surfaces
    if (geometryType === 'iiw_block' && radiusSurface?.enabled) {
      return createIIWBlockGeometry(length, width, height, radiusSurface);
    }

    // Simple flat block - use BoxGeometry
    if (topCurvature.type === 'flat' && frontCurvature.type === 'flat') {
      return new THREE.BoxGeometry(length, height, width);
    }

    // For curved blocks, create a more complex geometry
    if (topCurvature.type !== 'flat') {
      // Curved top surface
      const segmentsX = 32;
      const segmentsZ = 16;
      const geo = new THREE.BufferGeometry();

      const positions: number[] = [];
      const normals: number[] = [];
      const indices: number[] = [];

      const halfLength = length / 2;
      const halfWidth = width / 2;
      const halfHeight = height / 2;

      // Calculate curve parameters
      const curveHeight = topCurvature.type === 'convex'
        ? Math.min(height * 0.25, topCurvature.radius * 0.15)
        : -Math.min(height * 0.15, topCurvature.radius * 0.1);

      // Generate top surface vertices
      for (let iz = 0; iz <= segmentsZ; iz++) {
        const tz = iz / segmentsZ;
        const z = (tz - 0.5) * width;

        for (let ix = 0; ix <= segmentsX; ix++) {
          const tx = ix / segmentsX;
          const x = (tx - 0.5) * length;

          // Calculate curved Y based on X position (cylindrical curve along X)
          const normalizedX = (tx - 0.5) * 2; // -1 to 1
          const curve = curveHeight * (1 - normalizedX * normalizedX);
          const y = halfHeight + curve;

          positions.push(x, y, z);

          // Calculate normal
          const dx = -2 * curveHeight * normalizedX / length;
          const normal = new THREE.Vector3(-dx, 1, 0).normalize();
          normals.push(normal.x, normal.y, normal.z);
        }
      }

      // Top surface indices
      const topOffset = 0;
      for (let iz = 0; iz < segmentsZ; iz++) {
        for (let ix = 0; ix < segmentsX; ix++) {
          const a = topOffset + iz * (segmentsX + 1) + ix;
          const b = a + 1;
          const c = a + (segmentsX + 1);
          const d = c + 1;
          indices.push(a, c, b, b, c, d);
        }
      }

      // Bottom surface (flat)
      const bottomOffset = positions.length / 3;
      for (let iz = 0; iz <= segmentsZ; iz++) {
        const z = ((iz / segmentsZ) - 0.5) * width;
        for (let ix = 0; ix <= segmentsX; ix++) {
          const x = ((ix / segmentsX) - 0.5) * length;
          positions.push(x, -halfHeight, z);
          normals.push(0, -1, 0);
        }
      }

      // Bottom surface indices (reversed winding)
      for (let iz = 0; iz < segmentsZ; iz++) {
        for (let ix = 0; ix < segmentsX; ix++) {
          const a = bottomOffset + iz * (segmentsX + 1) + ix;
          const b = a + 1;
          const c = a + (segmentsX + 1);
          const d = c + 1;
          indices.push(a, b, c, b, d, c);
        }
      }

      // Front face (z = +halfWidth)
      const frontOffset = positions.length / 3;
      for (let ix = 0; ix <= segmentsX; ix++) {
        const tx = ix / segmentsX;
        const x = (tx - 0.5) * length;
        const normalizedX = (tx - 0.5) * 2;
        const curve = curveHeight * (1 - normalizedX * normalizedX);

        // Top edge
        positions.push(x, halfHeight + curve, halfWidth);
        normals.push(0, 0, 1);
        // Bottom edge
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

      // Back face (z = -halfWidth)
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

      // Left face (x = -halfLength)
      const leftOffset = positions.length / 3;
      positions.push(-halfLength, halfHeight + curveHeight, halfWidth);
      positions.push(-halfLength, -halfHeight, halfWidth);
      positions.push(-halfLength, halfHeight + curveHeight, -halfWidth);
      positions.push(-halfLength, -halfHeight, -halfWidth);
      for (let i = 0; i < 4; i++) normals.push(-1, 0, 0);
      indices.push(leftOffset, leftOffset + 1, leftOffset + 2);
      indices.push(leftOffset + 1, leftOffset + 3, leftOffset + 2);

      // Right face (x = +halfLength)
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
  }, [geometryType, length, width, height, outerDiameter, innerDiameter, cylinderLength, topCurvature, frontCurvature, cornerRadius, radiusSurface]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        roughness={0.35}
        metalness={0.75}
        envMapIntensity={0.8}
      />
    </mesh>
  );
}
