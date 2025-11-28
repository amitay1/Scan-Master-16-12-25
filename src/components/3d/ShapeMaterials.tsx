import * as THREE from 'three';

/**
 * Material presets for different metal types
 */
export const createMetalMaterial = (color: string, roughness = 0.3, metalness = 0.9) => {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness,
    envMapIntensity: 1.5,
  });
};

export const ShapeMaterials = {
  // Blues - Plates & Sheets
  plateBlue: () => createMetalMaterial('#3b82f6', 0.25, 0.95),
  sheetBlue: () => createMetalMaterial('#60a5fa', 0.2, 0.95),
  slabBlue: () => createMetalMaterial('#2563eb', 0.3, 0.9),
  
  // Greens - Flat & Rectangular Bars
  flatBarGreen: () => createMetalMaterial('#10b981', 0.3, 0.85),
  rectBarGreen: () => createMetalMaterial('#059669', 0.35, 0.85),
  
  // Oranges/Yellows - Square & Block
  squareBarOrange: () => createMetalMaterial('#f59e0b', 0.3, 0.9),
  billetYellow: () => createMetalMaterial('#fbbf24', 0.25, 0.9),
  blockOrange: () => createMetalMaterial('#f59e0b', 0.35, 0.85),
  
  // Purples - Round Bars & Shafts
  roundBarPurple: () => createMetalMaterial('#8b5cf6', 0.25, 0.95),
  shaftPurple: () => createMetalMaterial('#a78bfa', 0.3, 0.9),
  
  // Reds - Forgings
  forgingRed: () => createMetalMaterial('#ef4444', 0.4, 0.8),
  roundForgingRed: () => createMetalMaterial('#f87171', 0.35, 0.85),
  
  // Pinks - Ring & Disk Forgings
  ringForgingPink: () => createMetalMaterial('#ec4899', 0.3, 0.9),
  diskForgingTeal: () => createMetalMaterial('#14b8a6', 0.25, 0.95),
  
  // Cyans - Hex & Extrusions
  hexBarCyan: () => createMetalMaterial('#06b6d4', 0.3, 0.9),
  extrusionCyan: () => createMetalMaterial('#0891b2', 0.35, 0.85),
  
  // Grays - Tubes & Generic
  tubeGray: () => createMetalMaterial('#64748b', 0.25, 0.95),
  pipeGray: () => createMetalMaterial('#475569', 0.3, 0.9),
  sleeveGray: () => createMetalMaterial('#94a3b8', 0.25, 0.9),
  genericGray: () => createMetalMaterial('#71717a', 0.4, 0.7),
  
  // Edge highlighting material (for glowing edges)
  edgeGlow: (color: string) => new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.6,
    side: THREE.BackSide,
  }),
};

/**
 * Material colors for different metal types (MIL-STD-2154 compliant)
 */
export const MaterialTypeColors = {
  // Aluminum alloys - Light blue-gray (brushed aluminum)
  aluminum: '#A8B8C8',
  aluminium: '#A8B8C8',
  'aluminum-alloy': '#A8B8C8',
  '7075-t6': '#A8B8C8',
  '2024-t3': '#A8B8C8',
  '6061-t6': '#A8B8C8',
  
  // Titanium - Medium gray with slight blue tint (metallic sheen)
  titanium: '#9CA3AF',
  'ti-6al-4v': '#9CA3AF',
  
  // Steel - Dark gray (polished steel)
  steel: '#6B7280',
  'stainless-steel': '#6B7280',
  'carbon-steel': '#6B7280',
  '4340-steel': '#6B7280',
  
  // Magnesium - Light gray (matte)
  magnesium: '#D4D4D8',
  'magnesium-alloy': '#D4D4D8',
  
  // Nickel alloys - Warm gray
  inconel: '#8B8680',
  'nickel-alloy': '#8B8680',
  
  // Copper alloys - Reddish copper
  copper: '#B87333',
  bronze: '#CD7F32',
  brass: '#B5A642',
  
  // Default metallic gray
  default: '#71717a',
};

/**
 * Get material by material type (aerospace metals)
 */
export const getMaterialByMaterialType = (materialType?: string): THREE.MeshStandardMaterial => {
  if (!materialType) {
    return createMetalMaterial(MaterialTypeColors.default, 0.4, 0.7);
  }
  
  const normalizedMaterial = materialType.toLowerCase().replace(/\s+/g, '-');
  const color = MaterialTypeColors[normalizedMaterial as keyof typeof MaterialTypeColors] || MaterialTypeColors.default;
  
  // Adjust roughness and metalness based on material type
  let roughness = 0.3;
  let metalness = 0.9;
  
  if (normalizedMaterial.includes('aluminum') || normalizedMaterial.includes('aluminium')) {
    roughness = 0.25; // Brushed aluminum is smoother
    metalness = 0.95;
  } else if (normalizedMaterial.includes('titanium')) {
    roughness = 0.3; // Titanium has slight texture
    metalness = 0.9;
  } else if (normalizedMaterial.includes('steel') || normalizedMaterial.includes('stainless')) {
    roughness = 0.2; // Polished steel is very smooth
    metalness = 0.95;
  } else if (normalizedMaterial.includes('magnesium')) {
    roughness = 0.4; // Magnesium is more matte
    metalness = 0.85;
  }
  
  return createMetalMaterial(color, roughness, metalness);
};

/**
 * Get material by part type (legacy - for fallback)
 */
export const getMaterialByType = (partType: string): THREE.MeshStandardMaterial => {
  const materialMap: { [key: string]: () => THREE.MeshStandardMaterial } = {
    plate: ShapeMaterials.plateBlue,
    sheet: ShapeMaterials.sheetBlue,
    slab: ShapeMaterials.slabBlue,
    flat_bar: ShapeMaterials.flatBarGreen,
    rectangular_bar: ShapeMaterials.rectBarGreen,
    square_bar: ShapeMaterials.squareBarOrange,
    round_bar: ShapeMaterials.roundBarPurple,
    shaft: ShapeMaterials.shaftPurple,
    hex_bar: ShapeMaterials.hexBarCyan,
    tube: ShapeMaterials.tubeGray,
    pipe: ShapeMaterials.pipeGray,
    sleeve: ShapeMaterials.sleeveGray,
    bushing: ShapeMaterials.sleeveGray,
    disk: ShapeMaterials.genericGray,
    disk_forging: ShapeMaterials.diskForgingTeal,
    ring: ShapeMaterials.genericGray,
    ring_forging: ShapeMaterials.ringForgingPink,
    forging: ShapeMaterials.forgingRed,
    round_forging_stock: ShapeMaterials.roundForgingRed,
    rectangular_forging_stock: ShapeMaterials.forgingRed,
    billet: ShapeMaterials.billetYellow,
    block: ShapeMaterials.blockOrange,
    rectangular_tube: ShapeMaterials.tubeGray,
    square_tube: ShapeMaterials.tubeGray,
    hub: ShapeMaterials.diskForgingTeal,
    near_net_forging: ShapeMaterials.forgingRed,
    z_section: ShapeMaterials.extrusionCyan,
    custom_profile: ShapeMaterials.extrusionCyan,
    machined_component: ShapeMaterials.genericGray,
    cylinder: ShapeMaterials.roundBarPurple,
    sphere: ShapeMaterials.forgingRed,
    cone: ShapeMaterials.blockOrange,
    custom: ShapeMaterials.genericGray,
    extrusion_l: ShapeMaterials.extrusionCyan,
    extrusion_t: ShapeMaterials.extrusionCyan,
    extrusion_i: ShapeMaterials.extrusionCyan,
    extrusion_u: ShapeMaterials.extrusionCyan,
    extrusion_channel: ShapeMaterials.extrusionCyan,
    extrusion_angle: ShapeMaterials.extrusionCyan,
  };
  
  return (materialMap[partType] || ShapeMaterials.genericGray)();
};
