import * as THREE from 'three';
import { CSG } from 'three-csg-ts';

/**
 * Helper function to perfectly center any geometry at origin
 */
function perfectCenter(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  geometry.computeBoundingBox();
  const boundingBox = geometry.boundingBox;
  
  if (boundingBox) {
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
  }
  
  return geometry;
}

/**
 * Create hollow geometry by subtracting inner geometry from outer
 * Improved error handling and validation to prevent crashes
 */
function createHollowGeometry(
  outerGeometry: THREE.BufferGeometry,
  innerGeometry: THREE.BufferGeometry
): THREE.BufferGeometry {
  try {
    // Validate input geometries
    if (!outerGeometry || !innerGeometry) {
      console.warn('Invalid geometry provided for CSG operation, returning outer geometry');
      return outerGeometry;
    }
    
    // Ensure geometries have proper attributes
    if (!outerGeometry.attributes.position || !innerGeometry.attributes.position) {
      console.warn('Geometry missing position attribute, returning outer geometry');
      return outerGeometry;
    }
    
    // Check for degenerate geometries
    const outerPositions = outerGeometry.attributes.position.array;
    const innerPositions = innerGeometry.attributes.position.array;
    
    if (outerPositions.length < 9 || innerPositions.length < 9) { // At least 3 vertices (x,y,z each)
      console.warn('Degenerate geometry detected, returning outer geometry');
      return outerGeometry;
    }
    
    // Create meshes with error checking
    const outerMesh = new THREE.Mesh(outerGeometry.clone());
    const innerMesh = new THREE.Mesh(innerGeometry.clone());
    
    // Ensure meshes are properly initialized
    outerMesh.updateMatrix();
    innerMesh.updateMatrix();
    
    // Perform CSG operation with additional error handling
    let resultMesh;
    try {
      resultMesh = CSG.subtract(outerMesh, innerMesh);
    } catch (csgError) {
      console.warn('CSG.subtract failed, attempting fallback:', csgError);
      // Return a clone of outer geometry to prevent mutation issues
      return outerGeometry.clone();
    }
    
    // Validate result
    if (!resultMesh || !resultMesh.geometry) {
      console.warn('CSG operation produced invalid result, returning outer geometry');
      return outerGeometry.clone();
    }
    
    // Ensure the result geometry is valid
    const resultGeometry = resultMesh.geometry;
    if (!resultGeometry.attributes.position) {
      console.warn('CSG result missing position attribute, returning outer geometry');
      return outerGeometry.clone();
    }
    
    return resultGeometry;
  } catch (error) {
    console.error('Unexpected error in createHollowGeometry, safely returning outer geometry:', error);
    // Return a clone to prevent mutation issues
    return outerGeometry.clone();
  }
}

export interface ShapeParameters {
  isHollow?: boolean;
  outerDiameter?: number;
  innerDiameter?: number;
  length?: number;
  width?: number;
  thickness?: number;
  innerLength?: number;
  innerWidth?: number;
}

/**
 * Create 3D geometries for all part types
 * All geometries are perfectly centered at origin (0,0,0)
 */

export const ShapeGeometries = {
  // ============= BASE GEOMETRIES =============
  box: (params?: ShapeParameters) => {
    const outer = new THREE.BoxGeometry(2, 1, 1.5);
    
    if (params?.isHollow && params.innerLength && params.innerWidth) {
      // Validate parameters are positive and reasonable
      if (params.innerLength <= 0 || params.innerWidth <= 0) {
        console.warn('Invalid inner dimensions for hollow box, returning solid geometry');
        return perfectCenter(outer);
      }
      
      const inner = new THREE.BoxGeometry(
        Math.min(params.innerLength / 100 * 2, 1.9), // Ensure inner is smaller than outer
        params.thickness ? Math.min(params.thickness / 50, 0.9) : 0.8,
        Math.min(params.innerWidth / 75 * 1.5, 1.4)
      );
      return perfectCenter(createHollowGeometry(outer, inner));
    }
    
    return perfectCenter(outer);
  },
  
  cylinder: (params?: ShapeParameters) => {
    const outerRadius = 0.5;
    const height = 2;
    const outer = new THREE.CylinderGeometry(outerRadius, outerRadius, height, 32);
    outer.rotateZ(Math.PI / 2);
    
    if (params?.isHollow && params.innerDiameter && params.outerDiameter) {
      // Validate diameters
      if (params.innerDiameter <= 0 || params.outerDiameter <= 0 || 
          params.innerDiameter >= params.outerDiameter) {
        console.warn('Invalid hollow cylinder dimensions, returning solid geometry');
        return perfectCenter(outer);
      }
      
      const innerRadius = Math.min((params.innerDiameter / params.outerDiameter) * outerRadius, outerRadius * 0.95);
      const inner = new THREE.CylinderGeometry(innerRadius, innerRadius, height + 0.1, 32);
      inner.rotateZ(Math.PI / 2);
      return perfectCenter(createHollowGeometry(outer, inner));
    }
    
    return perfectCenter(outer);
  },
  
  tube: (params?: ShapeParameters) => {
    // Tube is always hollow
    const outerRadius = 0.8;
    const innerRadius = params?.innerDiameter && params?.outerDiameter
      ? outerRadius * (params.innerDiameter / params.outerDiameter)
      : outerRadius * 0.6;
    
    const tubeRadius = (outerRadius - innerRadius) / 2;
    const geometry = new THREE.TorusGeometry(
      (outerRadius + innerRadius) / 2,
      tubeRadius,
      16,
      32
    );
    geometry.rotateX(Math.PI / 2);
    return perfectCenter(geometry);
  },
  
  rectangular_tube: (params?: ShapeParameters) => {
    const outer = new THREE.BoxGeometry(1, 2, 0.6);
    
    if (params?.innerLength && params.innerWidth) {
      const inner = new THREE.BoxGeometry(
        0.7,
        params.innerLength / 100 * 2,
        params.innerWidth / 100 * 0.6
      );
      return perfectCenter(createHollowGeometry(outer, inner));
    }
    
    return perfectCenter(outer);
  },
  
  hexagon: (params?: ShapeParameters) => {
    const outerRadius = 0.5;
    const height = 2;
    const outer = new THREE.CylinderGeometry(outerRadius, outerRadius, height, 6);
    outer.rotateZ(Math.PI / 2);
    
    if (params?.isHollow && params.innerDiameter && params.outerDiameter) {
      // Validate diameters
      if (params.innerDiameter <= 0 || params.outerDiameter <= 0 || 
          params.innerDiameter >= params.outerDiameter) {
        console.warn('Invalid hollow hexagon dimensions, returning solid geometry');
        return perfectCenter(outer);
      }
      
      const innerRadius = Math.min((params.innerDiameter / params.outerDiameter) * outerRadius, outerRadius * 0.95);
      const inner = new THREE.CylinderGeometry(innerRadius, innerRadius, height + 0.1, 6);
      inner.rotateZ(Math.PI / 2);
      return perfectCenter(createHollowGeometry(outer, inner));
    }
    
    return perfectCenter(outer);
  },
  
  sphere: (params?: ShapeParameters) => {
    const outerRadius = 0.7;
    const outer = new THREE.SphereGeometry(outerRadius, 32, 32);
    
    if (params?.isHollow && params.innerDiameter && params.outerDiameter) {
      // Validate diameters
      if (params.innerDiameter <= 0 || params.outerDiameter <= 0 || 
          params.innerDiameter >= params.outerDiameter) {
        console.warn('Invalid hollow sphere dimensions, returning solid geometry');
        return perfectCenter(outer);
      }
      
      const innerRadius = Math.min((params.innerDiameter / params.outerDiameter) * outerRadius, outerRadius * 0.95);
      const inner = new THREE.SphereGeometry(innerRadius, 32, 32);
      return perfectCenter(createHollowGeometry(outer, inner));
    }
    
    return perfectCenter(outer);
  },
  
  cone: (params?: ShapeParameters) => {
    const geometry = new THREE.ConeGeometry(0.7, 1.5, 32);
    return perfectCenter(geometry);
  },
  
  // ============= STRUCTURAL PROFILES =============
  l_profile: (params?: ShapeParameters) => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.4, -0.4);
    shape.lineTo(0.4, -0.4);
    shape.lineTo(0.4, -0.2);
    shape.lineTo(-0.2, -0.2);
    shape.lineTo(-0.2, 0.4);
    shape.lineTo(-0.4, 0.4);
    shape.lineTo(-0.4, -0.4);
    
    const extrudeSettings = { steps: 1, depth: 2, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateY(Math.PI / 2);
    return perfectCenter(geometry);
  },
  
  t_profile: (params?: ShapeParameters) => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.4, -0.4);
    shape.lineTo(0.4, -0.4);
    shape.lineTo(0.4, -0.2);
    shape.lineTo(0.1, -0.2);
    shape.lineTo(0.1, 0.4);
    shape.lineTo(-0.1, 0.4);
    shape.lineTo(-0.1, -0.2);
    shape.lineTo(-0.4, -0.2);
    shape.lineTo(-0.4, -0.4);
    
    const extrudeSettings = { steps: 1, depth: 2, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateY(Math.PI / 2);
    return perfectCenter(geometry);
  },
  
  i_profile: (params?: ShapeParameters) => {
    const geometry = new THREE.BoxGeometry(0.6, 2, 0.15);
    return perfectCenter(geometry);
  },
  
  u_profile: (params?: ShapeParameters) => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.3, -0.4);
    shape.lineTo(-0.3, 0.4);
    shape.lineTo(0.3, 0.4);
    shape.lineTo(0.3, -0.4);
    shape.lineTo(0.2, -0.4);
    shape.lineTo(0.2, 0.3);
    shape.lineTo(-0.2, 0.3);
    shape.lineTo(-0.2, -0.4);
    shape.lineTo(-0.3, -0.4);
    
    const extrudeSettings = { steps: 1, depth: 2, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateY(Math.PI / 2);
    return perfectCenter(geometry);
  },
  
  z_profile: (params?: ShapeParameters) => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.3, -0.5);
    shape.lineTo(0.3, -0.5);
    shape.lineTo(0.3, -0.3);
    shape.lineTo(0, 0);
    shape.lineTo(0.3, 0.3);
    shape.lineTo(0.3, 0.5);
    shape.lineTo(-0.3, 0.5);
    shape.lineTo(-0.3, 0.3);
    shape.lineTo(0, 0);
    shape.lineTo(-0.3, -0.3);
    shape.lineTo(-0.3, -0.5);
    
    const extrudeSettings = { steps: 1, depth: 2, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateY(Math.PI / 2);
    return perfectCenter(geometry);
  },
  
  // ============= LEGACY MAPPINGS (for backward compatibility) =============
  plate: (params?: ShapeParameters) => ShapeGeometries.box(params),
  sheet: (params?: ShapeParameters) => ShapeGeometries.box(params),
  slab: (params?: ShapeParameters) => ShapeGeometries.box(params),
  flat_bar: (params?: ShapeParameters) => ShapeGeometries.box(params),
  rectangular_bar: (params?: ShapeParameters) => ShapeGeometries.box(params),
  square_bar: (params?: ShapeParameters) => ShapeGeometries.box(params),
  billet: (params?: ShapeParameters) => ShapeGeometries.box(params),
  block: (params?: ShapeParameters) => ShapeGeometries.box(params),
  
  round_bar: (params?: ShapeParameters) => ShapeGeometries.cylinder(params),
  shaft: (params?: ShapeParameters) => ShapeGeometries.cylinder(params),
  disk: (params?: ShapeParameters) => ShapeGeometries.cylinder(params),
  disk_forging: (params?: ShapeParameters) => ShapeGeometries.cylinder(params),
  hub: (params?: ShapeParameters) => ShapeGeometries.cylinder(params),
  
  pipe: (params?: ShapeParameters) => ShapeGeometries.tube(params),
  ring: (params?: ShapeParameters) => ShapeGeometries.tube(params),
  ring_forging: (params?: ShapeParameters) => ShapeGeometries.tube(params),
  sleeve: (params?: ShapeParameters) => ShapeGeometries.tube(params),
  bushing: (params?: ShapeParameters) => ShapeGeometries.tube(params),
  
  square_tube: (params?: ShapeParameters) => ShapeGeometries.rectangular_tube(params),
  
  hex_bar: (params?: ShapeParameters) => ShapeGeometries.hexagon(params),
  
  extrusion_l: (params?: ShapeParameters) => ShapeGeometries.l_profile(params),
  extrusion_angle: (params?: ShapeParameters) => ShapeGeometries.l_profile(params),
  extrusion_t: (params?: ShapeParameters) => ShapeGeometries.t_profile(params),
  extrusion_i: (params?: ShapeParameters) => ShapeGeometries.i_profile(params),
  extrusion_u: (params?: ShapeParameters) => ShapeGeometries.u_profile(params),
  extrusion_channel: (params?: ShapeParameters) => ShapeGeometries.u_profile(params),
  
  // Generic fallbacks
  bar: (params?: ShapeParameters) => ShapeGeometries.box(params),
  forging: (params?: ShapeParameters) => ShapeGeometries.cylinder(params),
  round_forging_stock: (params?: ShapeParameters) => ShapeGeometries.cylinder(params),
  rectangular_forging_stock: (params?: ShapeParameters) => ShapeGeometries.box(params),
  near_net_forging: (params?: ShapeParameters) => ShapeGeometries.cylinder(params),
  machined_component: (params?: ShapeParameters) => ShapeGeometries.box(params),
  custom_profile: (params?: ShapeParameters) => ShapeGeometries.box(params),
  custom: (params?: ShapeParameters) => ShapeGeometries.box(params),
};

/**
 * Get geometry by part type with optional hollow parameters
 */
export const getGeometryByType = (
  partType: string,
  params?: ShapeParameters
): THREE.BufferGeometry => {
  const geometryFunc = (ShapeGeometries as any)[partType];
  if (geometryFunc) {
    return geometryFunc(params);
  }
  // Fallback to generic box
  const fallback = new THREE.BoxGeometry(1, 1, 1);
  return perfectCenter(fallback);
};