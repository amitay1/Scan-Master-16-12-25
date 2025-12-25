import * as THREE from 'three';

/**
 * Premium material presets using MeshPhysicalMaterial
 * MeshPhysicalMaterial provides clearcoat, sheen, and other advanced PBR features
 */
export const createPremiumMetalMaterial = (
  color: string,
  roughness = 0.3,
  metalness = 0.9,
  clearcoat = 0.3,
  clearcoatRoughness = 0.2
) => {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness,
    envMapIntensity: 2.0,
    clearcoat,
    clearcoatRoughness,
    reflectivity: 1.0,
    ior: 2.5, // Higher IOR for metals
  });
};

/**
 * Legacy material creation for backward compatibility
 */
export const createMetalMaterial = (color: string, roughness = 0.3, metalness = 0.9) => {
  return createPremiumMetalMaterial(color, roughness, metalness, 0.2, 0.3);
};

export const ShapeMaterials = {
  // Blues - Plates & Sheets
  plateBlue: () => createPremiumMetalMaterial('#3b82f6', 0.20, 0.95, 0.4, 0.15),
  sheetBlue: () => createPremiumMetalMaterial('#60a5fa', 0.15, 0.95, 0.5, 0.1),
  slabBlue: () => createPremiumMetalMaterial('#2563eb', 0.25, 0.90, 0.3, 0.2),

  // Greens - Flat & Rectangular Bars
  flatBarGreen: () => createPremiumMetalMaterial('#10b981', 0.25, 0.90, 0.35, 0.2),
  rectBarGreen: () => createPremiumMetalMaterial('#059669', 0.30, 0.88, 0.3, 0.25),

  // Oranges/Yellows - Square & Block
  squareBarOrange: () => createPremiumMetalMaterial('#f59e0b', 0.25, 0.92, 0.4, 0.15),
  billetYellow: () => createPremiumMetalMaterial('#fbbf24', 0.20, 0.93, 0.45, 0.1),
  blockOrange: () => createPremiumMetalMaterial('#f59e0b', 0.30, 0.88, 0.35, 0.2),

  // Purples - Round Bars & Shafts
  roundBarPurple: () => createPremiumMetalMaterial('#8b5cf6', 0.20, 0.95, 0.45, 0.12),
  shaftPurple: () => createPremiumMetalMaterial('#a78bfa', 0.25, 0.92, 0.4, 0.15),

  // Reds - Forgings
  forgingRed: () => createPremiumMetalMaterial('#ef4444', 0.35, 0.85, 0.25, 0.3),
  roundForgingRed: () => createPremiumMetalMaterial('#f87171', 0.30, 0.88, 0.3, 0.25),

  // Pinks - Ring & Disk Forgings
  ringForgingPink: () => createPremiumMetalMaterial('#ec4899', 0.25, 0.92, 0.4, 0.18),
  diskForgingTeal: () => createPremiumMetalMaterial('#14b8a6', 0.20, 0.95, 0.5, 0.1),

  // Cyans - Hex & Extrusions
  hexBarCyan: () => createPremiumMetalMaterial('#06b6d4', 0.25, 0.92, 0.4, 0.15),
  extrusionCyan: () => createPremiumMetalMaterial('#0891b2', 0.30, 0.88, 0.35, 0.2),

  // Grays - Tubes & Generic
  tubeGray: () => createPremiumMetalMaterial('#64748b', 0.20, 0.95, 0.45, 0.12),
  pipeGray: () => createPremiumMetalMaterial('#475569', 0.25, 0.92, 0.4, 0.15),
  sleeveGray: () => createPremiumMetalMaterial('#94a3b8', 0.20, 0.93, 0.45, 0.1),
  genericGray: () => createPremiumMetalMaterial('#71717a', 0.35, 0.80, 0.25, 0.3),

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
 * Premium PBR Material Properties for ultra-realistic metal rendering
 * Using MeshPhysicalMaterial properties
 */
interface PremiumMetalProperties {
  roughness: number;
  metalness: number;
  envMapIntensity: number;
  clearcoat: number;
  clearcoatRoughness: number;
  reflectivity: number;
  ior: number;
}

const PremiumMetalPBRProperties: Record<string, PremiumMetalProperties> = {
  // Aluminum - clean, reflective with subtle clearcoat
  aluminum: {
    roughness: 0.18,
    metalness: 0.95,
    envMapIntensity: 2.0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.1,
    reflectivity: 1.0,
    ior: 2.4
  },
  aluminium: {
    roughness: 0.18,
    metalness: 0.95,
    envMapIntensity: 2.0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.1,
    reflectivity: 1.0,
    ior: 2.4
  },

  // Titanium - slightly rougher, warm reflections
  titanium: {
    roughness: 0.28,
    metalness: 0.92,
    envMapIntensity: 1.8,
    clearcoat: 0.3,
    clearcoatRoughness: 0.15,
    reflectivity: 0.9,
    ior: 2.6
  },

  // Steel varieties
  steel: {
    roughness: 0.22,
    metalness: 0.95,
    envMapIntensity: 2.2,
    clearcoat: 0.35,
    clearcoatRoughness: 0.12,
    reflectivity: 1.0,
    ior: 2.5
  },
  'stainless-steel': {
    roughness: 0.08,
    metalness: 0.98,
    envMapIntensity: 2.8,
    clearcoat: 0.6,
    clearcoatRoughness: 0.05,
    reflectivity: 1.0,
    ior: 2.8
  },
  'carbon-steel': {
    roughness: 0.35,
    metalness: 0.90,
    envMapIntensity: 1.5,
    clearcoat: 0.2,
    clearcoatRoughness: 0.25,
    reflectivity: 0.85,
    ior: 2.3
  },
  'tool-steel': {
    roughness: 0.30,
    metalness: 0.92,
    envMapIntensity: 1.7,
    clearcoat: 0.25,
    clearcoatRoughness: 0.2,
    reflectivity: 0.9,
    ior: 2.4
  },

  // Magnesium - more matte finish
  magnesium: {
    roughness: 0.40,
    metalness: 0.85,
    envMapIntensity: 1.2,
    clearcoat: 0.15,
    clearcoatRoughness: 0.35,
    reflectivity: 0.75,
    ior: 1.8
  },

  // Nickel alloys - highly reflective
  nickel: {
    roughness: 0.12,
    metalness: 0.98,
    envMapIntensity: 2.5,
    clearcoat: 0.5,
    clearcoatRoughness: 0.08,
    reflectivity: 1.0,
    ior: 2.7
  },
  inconel: {
    roughness: 0.20,
    metalness: 0.95,
    envMapIntensity: 2.2,
    clearcoat: 0.4,
    clearcoatRoughness: 0.12,
    reflectivity: 0.95,
    ior: 2.5
  },

  // Copper alloys - warm, distinctive reflections
  copper: {
    roughness: 0.15,
    metalness: 0.98,
    envMapIntensity: 2.5,
    clearcoat: 0.5,
    clearcoatRoughness: 0.08,
    reflectivity: 1.0,
    ior: 2.6
  },
  bronze: {
    roughness: 0.25,
    metalness: 0.93,
    envMapIntensity: 2.0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.15,
    reflectivity: 0.9,
    ior: 2.4
  },
  brass: {
    roughness: 0.10,
    metalness: 0.98,
    envMapIntensity: 2.8,
    clearcoat: 0.6,
    clearcoatRoughness: 0.05,
    reflectivity: 1.0,
    ior: 2.7
  },

  // Precious metals - mirror-like
  gold: {
    roughness: 0.05,
    metalness: 1.0,
    envMapIntensity: 3.0,
    clearcoat: 0.7,
    clearcoatRoughness: 0.02,
    reflectivity: 1.0,
    ior: 3.0
  },
  silver: {
    roughness: 0.05,
    metalness: 1.0,
    envMapIntensity: 3.0,
    clearcoat: 0.7,
    clearcoatRoughness: 0.02,
    reflectivity: 1.0,
    ior: 3.0
  },
  platinum: {
    roughness: 0.08,
    metalness: 0.99,
    envMapIntensity: 2.8,
    clearcoat: 0.65,
    clearcoatRoughness: 0.03,
    reflectivity: 1.0,
    ior: 2.9
  },
  chromium: {
    roughness: 0.02,
    metalness: 1.0,
    envMapIntensity: 3.5,
    clearcoat: 0.8,
    clearcoatRoughness: 0.01,
    reflectivity: 1.0,
    ior: 3.2
  },

  default: {
    roughness: 0.30,
    metalness: 0.88,
    envMapIntensity: 1.8,
    clearcoat: 0.3,
    clearcoatRoughness: 0.2,
    reflectivity: 0.85,
    ior: 2.2
  },
};

/**
 * Get premium PBR properties for a material type
 */
const getPremiumPBRProperties = (materialType: string): PremiumMetalProperties => {
  // Check for exact match
  if (PremiumMetalPBRProperties[materialType]) {
    return PremiumMetalPBRProperties[materialType];
  }

  // Check for partial matches
  for (const [key, props] of Object.entries(PremiumMetalPBRProperties)) {
    if (materialType.includes(key) || key.includes(materialType)) {
      return props;
    }
  }

  return PremiumMetalPBRProperties.default;
};

/**
 * Get material by material type (aerospace metals) - PREMIUM PBR
 * Creates physically accurate metallic materials with MeshPhysicalMaterial
 */
export const getMaterialByMaterialType = (materialType?: string): THREE.MeshPhysicalMaterial => {
  if (!materialType) {
    const defaultProps = PremiumMetalPBRProperties.default;
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(MaterialTypeColors.default),
      roughness: defaultProps.roughness,
      metalness: defaultProps.metalness,
      envMapIntensity: defaultProps.envMapIntensity,
      clearcoat: defaultProps.clearcoat,
      clearcoatRoughness: defaultProps.clearcoatRoughness,
      reflectivity: defaultProps.reflectivity,
      ior: defaultProps.ior,
    });
  }

  const normalizedMaterial = materialType.toLowerCase().replace(/\s+/g, '-');
  const color = MaterialTypeColors[normalizedMaterial] || MaterialTypeColors.default;
  const pbrProps = getPremiumPBRProperties(normalizedMaterial);

  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: pbrProps.roughness,
    metalness: pbrProps.metalness,
    envMapIntensity: pbrProps.envMapIntensity,
    clearcoat: pbrProps.clearcoat,
    clearcoatRoughness: pbrProps.clearcoatRoughness,
    reflectivity: pbrProps.reflectivity,
    ior: pbrProps.ior,
  });
};

/**
 * Get material by part type (legacy - for fallback)
 */
export const getMaterialByType = (partType: string): THREE.MeshPhysicalMaterial => {
  const materialMap: { [key: string]: () => THREE.MeshPhysicalMaterial } = {
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
