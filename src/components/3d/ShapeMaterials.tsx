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
 * Material colors for different metal types - ACCURATE REAL-WORLD COLORS
 * Based on industry standards and verified color codes
 * Sources: rgbcolorcode.com, encycolorpedia.com, htmlcolorcodes.com
 */
export const MaterialTypeColors: Record<string, string> = {
  // ═══════════════════════════════════════════════════════════════════
  // ALUMINUM ALLOYS - Silvery-white with slight gray tint
  // Real aluminum: #848789 to #D9DAD9 depending on finish
  // ═══════════════════════════════════════════════════════════════════
  aluminum: '#A8A9AD',        // Polished aluminum - silvery gray
  aluminium: '#A8A9AD',
  'aluminum-alloy': '#A8A9AD',
  '7075-t6': '#9FA0A4',       // Slightly darker - high strength alloy
  '2024-t3': '#B0B1B5',       // Slightly lighter
  '6061-t6': '#A8A9AD',

  // ═══════════════════════════════════════════════════════════════════
  // TITANIUM - Gray with warm/brownish undertone
  // Real titanium: #878681 (warm gray)
  // ═══════════════════════════════════════════════════════════════════
  titanium: '#878681',        // Accurate titanium gray
  'ti-6al-4v': '#7A7772',     // Grade 5 - slightly darker metallic
  'ti-6242': '#8A8984',
  'titanium-alloy': '#878681',

  // ═══════════════════════════════════════════════════════════════════
  // STEEL - Varies from dark gray to silver depending on finish
  // Polished steel: #CFD4D9, Carbon steel: #71797E
  // ═══════════════════════════════════════════════════════════════════
  steel: '#71797E',           // Carbon steel - bluish gray
  'stainless-steel': '#C0C5C9', // Polished stainless - brighter
  'carbon-steel': '#5C6670',  // Darker, less reflective
  '4340-steel': '#6B7378',    // Alloy steel
  '304-stainless': '#BEC3C7',
  '316-stainless': '#C4C9CD',
  'tool-steel': '#4A5258',    // Dark gray

  // ═══════════════════════════════════════════════════════════════════
  // MAGNESIUM - Very light silvery white
  // Real magnesium: light silvery with matte finish
  // ═══════════════════════════════════════════════════════════════════
  magnesium: '#E8E8E8',       // Light silvery white
  'magnesium-alloy': '#E0E0E4',
  'az31': '#DCDCE0',

  // ═══════════════════════════════════════════════════════════════════
  // NICKEL ALLOYS - Silvery-white with slight warm tint
  // Real nickel: #727472 to #8D8E8C
  // ═══════════════════════════════════════════════════════════════════
  nickel: '#8D8E8C',          // Pure nickel
  inconel: '#7A7B79',         // Inconel - slightly darker
  'inconel-625': '#787978',
  'inconel-718': '#757674',
  'nickel-alloy': '#8D8E8C',
  monel: '#858684',           // Nickel-copper alloy
  hastelloy: '#727472',       // Darker nickel alloy

  // ═══════════════════════════════════════════════════════════════════
  // COPPER ALLOYS - Distinctive reddish/golden colors
  // Copper: #B87333, Bronze: #CD7F32, Brass: #B5A642
  // ═══════════════════════════════════════════════════════════════════
  copper: '#B87333',          // Classic copper - reddish brown
  'pure-copper': '#C27B47',   // Brighter copper
  bronze: '#CD7F32',          // Golden brown
  'phosphor-bronze': '#C9944A',
  'aluminum-bronze': '#A67B5B',
  brass: '#D4AF37',           // Golden yellow (closer to real brass)
  'naval-brass': '#C5A94D',
  'cartridge-brass': '#E1C16E', // Bright yellow brass

  // ═══════════════════════════════════════════════════════════════════
  // SPECIALTY METALS
  // ═══════════════════════════════════════════════════════════════════
  tungsten: '#5A5A5C',        // Dark gray
  cobalt: '#5D5E5E',          // Dark bluish gray
  chromium: '#DDE1E4',        // Very bright silvery
  zinc: '#A8A8A8',            // Light gray
  lead: '#6B6B6B',            // Dark gray with blue tint
  tin: '#D0D0D0',             // Light silvery gray
  gold: '#FFD700',            // Bright gold
  silver: '#C0C0C0',          // Classic silver
  platinum: '#E5E4E2',        // Whitish silver

  // Default metallic gray
  default: '#71717a',
};

/**
 * PBR Material Properties for realistic metal rendering
 * Roughness: 0 = mirror, 1 = matte
 * Metalness: 0 = dielectric, 1 = pure metal
 */
interface MetalProperties {
  roughness: number;
  metalness: number;
  envMapIntensity: number;
}

const MetalPBRProperties: Record<string, MetalProperties> = {
  // Aluminum - moderately reflective, slight texture
  aluminum: { roughness: 0.25, metalness: 0.92, envMapIntensity: 1.2 },
  aluminium: { roughness: 0.25, metalness: 0.92, envMapIntensity: 1.2 },

  // Titanium - slightly rougher surface
  titanium: { roughness: 0.35, metalness: 0.88, envMapIntensity: 1.0 },

  // Steel varieties
  steel: { roughness: 0.30, metalness: 0.90, envMapIntensity: 1.3 },
  'stainless-steel': { roughness: 0.15, metalness: 0.95, envMapIntensity: 1.8 }, // Very reflective
  'carbon-steel': { roughness: 0.40, metalness: 0.85, envMapIntensity: 0.9 },
  'tool-steel': { roughness: 0.35, metalness: 0.88, envMapIntensity: 1.0 },

  // Magnesium - more matte
  magnesium: { roughness: 0.45, metalness: 0.80, envMapIntensity: 0.8 },

  // Nickel alloys - very reflective
  nickel: { roughness: 0.20, metalness: 0.95, envMapIntensity: 1.5 },
  inconel: { roughness: 0.25, metalness: 0.92, envMapIntensity: 1.3 },

  // Copper alloys - distinctive properties
  copper: { roughness: 0.20, metalness: 0.95, envMapIntensity: 1.6 },
  bronze: { roughness: 0.30, metalness: 0.90, envMapIntensity: 1.2 },
  brass: { roughness: 0.15, metalness: 0.95, envMapIntensity: 1.8 }, // Very shiny

  // Specialty metals
  gold: { roughness: 0.10, metalness: 1.0, envMapIntensity: 2.0 },
  silver: { roughness: 0.10, metalness: 1.0, envMapIntensity: 2.0 },
  platinum: { roughness: 0.15, metalness: 0.98, envMapIntensity: 1.8 },
  chromium: { roughness: 0.05, metalness: 1.0, envMapIntensity: 2.5 }, // Mirror-like

  default: { roughness: 0.35, metalness: 0.85, envMapIntensity: 1.0 },
};

/**
 * Get PBR properties for a material type
 */
const getPBRProperties = (materialType: string): MetalProperties => {
  // Check for exact match
  if (MetalPBRProperties[materialType]) {
    return MetalPBRProperties[materialType];
  }

  // Check for partial matches
  for (const [key, props] of Object.entries(MetalPBRProperties)) {
    if (materialType.includes(key) || key.includes(materialType)) {
      return props;
    }
  }

  return MetalPBRProperties.default;
};

/**
 * Get material by material type (aerospace metals) - ENHANCED PBR
 * Creates physically accurate metallic materials
 */
export const getMaterialByMaterialType = (materialType?: string): THREE.MeshStandardMaterial => {
  if (!materialType) {
    return createMetalMaterial(MaterialTypeColors.default, 0.4, 0.7);
  }

  const normalizedMaterial = materialType.toLowerCase().replace(/\s+/g, '-');
  const color = MaterialTypeColors[normalizedMaterial] || MaterialTypeColors.default;
  const pbrProps = getPBRProperties(normalizedMaterial);

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: pbrProps.roughness,
    metalness: pbrProps.metalness,
    envMapIntensity: pbrProps.envMapIntensity,
    // Add subtle variation for more realistic appearance
    flatShading: false,
  });

  return material;
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
    machined_component: ShapeMaterials.genericGray,
    cylinder: ShapeMaterials.roundBarPurple,
    sphere: ShapeMaterials.forgingRed,
    cone: ShapeMaterials.blockOrange,
    custom: ShapeMaterials.genericGray,
  };
  
  return (materialMap[partType] || ShapeMaterials.genericGray)();
};
