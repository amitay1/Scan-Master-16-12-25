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
  // Track temporary geometries for cleanup
  let outerClone: THREE.BufferGeometry | null = null;
  let innerClone: THREE.BufferGeometry | null = null;

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

    // Create meshes with error checking - clone geometries for CSG
    outerClone = outerGeometry.clone();
    innerClone = innerGeometry.clone();
    const outerMesh = new THREE.Mesh(outerClone);
    const innerMesh = new THREE.Mesh(innerClone);

    // Ensure meshes are properly initialized
    outerMesh.updateMatrix();
    innerMesh.updateMatrix();

    // Perform CSG operation with additional error handling
    let resultMesh;
    try {
      resultMesh = CSG.subtract(outerMesh, innerMesh);
    } catch (csgError) {
      console.warn('CSG.subtract failed, attempting fallback:', csgError);
      // Dispose temporary geometries before returning
      outerClone?.dispose();
      innerClone?.dispose();
      // Return a clone of outer geometry to prevent mutation issues
      return outerGeometry.clone();
    }

    // Dispose temporary geometries - they're no longer needed
    outerClone.dispose();
    innerClone.dispose();
    outerClone = null;
    innerClone = null;

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
    // Dispose any temporary geometries on error
    outerClone?.dispose();
    innerClone?.dispose();
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
  // Cone-specific parameters
  coneTopDiameter?: number;      // Top diameter (smaller end, 0 = pointed)
  coneBottomDiameter?: number;   // Bottom diameter (base, larger end)
  coneHeight?: number;           // Height of the cone
  wallThickness?: number;        // Wall thickness for hollow cone
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
    // Tube can be shown as solid (cylinder) or hollow based on isHollow toggle
    const outerRadius = 0.5;
    const height = 2;

    // If isHollow is explicitly false, show as solid cylinder
    if (params?.isHollow === false) {
      const solid = new THREE.CylinderGeometry(outerRadius, outerRadius, height, 32);
      solid.rotateZ(Math.PI / 2);
      return perfectCenter(solid);
    }

    // Default: show as hollow tube
    const outer = new THREE.CylinderGeometry(outerRadius, outerRadius, height, 32);
    outer.rotateZ(Math.PI / 2);

    const innerRadius = params?.innerDiameter && params?.outerDiameter && params.innerDiameter > 0
      ? Math.min((params.innerDiameter / params.outerDiameter) * outerRadius, outerRadius * 0.95)
      : outerRadius * 0.6; // Default inner radius if not specified

    const inner = new THREE.CylinderGeometry(innerRadius, innerRadius, height + 0.1, 32);
    inner.rotateZ(Math.PI / 2);
    return perfectCenter(createHollowGeometry(outer, inner));
  },
  
  rectangular_tube: (params?: ShapeParameters) => {
    const outer = new THREE.BoxGeometry(1, 2, 0.6);

    // If isHollow is explicitly false, show as solid box
    if (params?.isHollow === false) {
      return perfectCenter(outer);
    }

    // Default: show as hollow rectangular tube
    if (params?.innerLength && params.innerWidth) {
      const inner = new THREE.BoxGeometry(
        0.7,
        params.innerLength / 100 * 2,
        params.innerWidth / 100 * 0.6
      );
      return perfectCenter(createHollowGeometry(outer, inner));
    }

    // Default hollow with standard wall thickness
    const inner = new THREE.BoxGeometry(0.7, 1.7, 0.4);
    return perfectCenter(createHollowGeometry(outer, inner));
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
    // CONE IS ALWAYS HOLLOW - it's a tapered tube in ultrasonic inspection
    // Never a solid pointed cone - always has wall thickness
    const bottomRadius = (params?.coneBottomDiameter || 100) / 100; // Scale to reasonable 3D size
    // Default top diameter is 30% of bottom diameter for a nice frustum shape
    const defaultTopDiameter = (params?.coneBottomDiameter || 100) * 0.3;
    // Top diameter must be at least 1mm (never pointed)
    const topRadius = Math.max((params?.coneTopDiameter ?? defaultTopDiameter) / 100, 0.01);
    const height = (params?.coneHeight || 150) / 100;
    // Wall thickness defaults to 10mm if not specified
    const wallThickness = (params?.wallThickness || 10) / 100;

    // ALWAYS create hollow cone (tapered tube) using LatheGeometry
    const points: THREE.Vector2[] = [];
    const innerBottomRadius = Math.max(bottomRadius - wallThickness, 0.01);
    const innerTopRadius = Math.max(topRadius - wallThickness, 0.005);

    // Create cross-section profile for hollow cone (clockwise from bottom-outer)
    points.push(new THREE.Vector2(bottomRadius, 0));           // Bottom outer
    points.push(new THREE.Vector2(topRadius, height));          // Top outer
    points.push(new THREE.Vector2(innerTopRadius, height));     // Top inner
    points.push(new THREE.Vector2(innerBottomRadius, 0));       // Bottom inner

    const geometry = new THREE.LatheGeometry(points, 64);
    return perfectCenter(geometry);
  },
  
  // ============= LEGACY MAPPINGS (for backward compatibility) =============

  // PLATE - Flat rectangular (W/T > 5 per ASTM E2375) - thin and wide
  plate: (params?: ShapeParameters) => {
    // Plate is thin: width >> thickness
    const outer = new THREE.BoxGeometry(2.5, 0.3, 1.8); // Wide and thin

    if (params?.isHollow && params.innerLength && params.innerWidth) {
      if (params.innerLength <= 0 || params.innerWidth <= 0) {
        return perfectCenter(outer);
      }
      const inner = new THREE.BoxGeometry(2.2, 0.25, 1.5);
      return perfectCenter(createHollowGeometry(outer, inner));
    }

    return perfectCenter(outer);
  },
  sheet: (params?: ShapeParameters) => ShapeGeometries.plate(params),
  slab: (params?: ShapeParameters) => ShapeGeometries.plate(params),
  flat_bar: (params?: ShapeParameters) => ShapeGeometries.plate(params),

  // BOX/BAR/BILLET - Compact rectangular (W/T < 5 per ASTM E2375)
  rectangular_bar: (params?: ShapeParameters) => ShapeGeometries.box(params),
  square_bar: (params?: ShapeParameters) => ShapeGeometries.box(params),
  billet: (params?: ShapeParameters) => ShapeGeometries.box(params),
  block: (params?: ShapeParameters) => ShapeGeometries.box(params),
  
  round_bar: (params?: ShapeParameters) => ShapeGeometries.cylinder(params),
  shaft: (params?: ShapeParameters) => ShapeGeometries.cylinder(params),
  hub: (params?: ShapeParameters) => ShapeGeometries.cylinder(params),

  // DISK - Flat solid circular (H/D < 0.5 per ASTM E2375)
  disk: (params?: ShapeParameters) => {
    const outerRadius = 1.0;
    const height = 0.4; // Flat disk - height much less than diameter
    const outer = new THREE.CylinderGeometry(outerRadius, outerRadius, height, 32);
    // No rotation - disk is flat like a pancake
    return perfectCenter(outer);
  },
  disk_forging: (params?: ShapeParameters) => {
    const outerRadius = 1.0;
    const height = 0.4; // Flat disk forging - H/D < 0.5
    const outer = new THREE.CylinderGeometry(outerRadius, outerRadius, height, 32);
    return perfectCenter(outer);
  },

  // RING - Short hollow circular (L/T < 5 per ASTM E2375)
  ring: (params?: ShapeParameters) => {
    const outerRadius = 0.8;
    const innerRadius = 0.5;
    const height = 0.6; // Short ring - L/T < 5
    const outer = new THREE.CylinderGeometry(outerRadius, outerRadius, height, 32);
    const inner = new THREE.CylinderGeometry(innerRadius, innerRadius, height + 0.1, 32);
    return perfectCenter(createHollowGeometry(outer, inner));
  },
  ring_forging: (params?: ShapeParameters) => {
    const outerRadius = 0.8;
    const innerRadius = 0.5;
    const height = 0.6; // Short ring forging - L/T < 5
    const outer = new THREE.CylinderGeometry(outerRadius, outerRadius, height, 32);
    const inner = new THREE.CylinderGeometry(innerRadius, innerRadius, height + 0.1, 32);
    return perfectCenter(createHollowGeometry(outer, inner));
  },

  pipe: (params?: ShapeParameters) => ShapeGeometries.tube(params),
  sleeve: (params?: ShapeParameters) => ShapeGeometries.tube(params),
  bushing: (params?: ShapeParameters) => ShapeGeometries.tube(params),
  
  square_tube: (params?: ShapeParameters) => ShapeGeometries.rectangular_tube(params),
  
  hex_bar: (params?: ShapeParameters) => ShapeGeometries.hexagon(params),

  // Generic fallbacks
  bar: (params?: ShapeParameters) => ShapeGeometries.box(params),
  forging: (params?: ShapeParameters) => ShapeGeometries.cylinder(params),
  round_forging_stock: (params?: ShapeParameters) => ShapeGeometries.cylinder(params),
  rectangular_forging_stock: (params?: ShapeParameters) => ShapeGeometries.box(params),
  near_net_forging: (params?: ShapeParameters) => ShapeGeometries.cylinder(params),
  machined_component: (params?: ShapeParameters) => ShapeGeometries.box(params),
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