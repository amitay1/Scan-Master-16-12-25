import { 
  MaterialType, 
  PartGeometry, 
  AcceptanceClass, 
  CalibrationRecommendation,
  CalibrationBlockType 
} from "@/types/techniqueSheet";

interface CalibrationInput {
  material: MaterialType;
  materialSpec: string;
  partType: PartGeometry;
  thickness: number;
  acceptanceClass: AcceptanceClass;
  frequency?: number;
}

// Table I - Reference materials
const getReferenceMaterial = (partMaterial: MaterialType): { primary: string; alternates: string[] } => {
  const mapping = {
    aluminum: {
      primary: "7075-T6 (QQ-A200/11)",
      alternates: ["2024 (QQ-A-200/3)"]
    },
    steel: {
      primary: "4340 annealed (MIL-S-5000)",
      alternates: []
    },
    titanium: {
      primary: "Ti-6Al-4V annealed (AMS 4928)",
      alternates: []
    },
    magnesium: {
      primary: "ZK60A (QQ-M-31)",
      alternates: []
    }
  };
  return mapping[partMaterial];
};

// Select calibration block type based on geometry
const selectBlockType = (partType: PartGeometry, thickness: number): { 
  type: CalibrationBlockType; 
  figure: string;
  reasoning: string;
} => {
  // Group 1: Flat geometries (plates, bars, billets, extrusions)
  const flatGeometries: PartGeometry[] = [
    "plate", "sheet", "slab", "flat_bar", "rectangular_bar", "square_bar", 
    "bar", "forging", "billet", "block",
    "extrusion_l", "extrusion_t", "extrusion_i", "extrusion_u", "extrusion_channel", "extrusion_angle"
  ];
  
  // Group 2: Cylindrical/tubular (tubes, pipes, sleeves, shafts)
  const tubularGeometries: PartGeometry[] = [
    "tube", "pipe", "ring", "ring_forging", "sleeve", "bushing"
  ];
  
  // Group 3: Solid rounds
  const roundGeometries: PartGeometry[] = [
    "round_bar", "round_forging_stock", "shaft"
  ];
  
  // Group 4: Disks
  const diskGeometries: PartGeometry[] = [
    "disk", "disk_forging"
  ];
  
  if (flatGeometries.includes(partType)) {
    if (thickness > 100) {
      return {
        type: "flat_block",
        figure: "Figure 4",
        reasoning: "Flat block suitable for thick plate geometry with multiple travel distances"
      };
    }
    return {
      type: "flat_block",
      figure: "Figure 4",
      reasoning: "Flat block suitable for plate/bar geometry per standard"
    };
  } else if (tubularGeometries.includes(partType)) {
    if (thickness < 25) {
      return {
        type: "cylinder_notched",
        figure: "Figure 5",
        reasoning: "Notched cylinder for thin-walled tubular geometry"
      };
    }
    return {
      type: "cylinder_fbh",
      figure: "Figure 6",
      reasoning: "FBH cylinder for thick-walled tubular geometry"
    };
  } else if (diskGeometries.includes(partType)) {
    return {
      type: "flat_block",
      figure: "Figure 4",
      reasoning: "Flat block for disk (treated as thick plate)"
    };
  } else if (roundGeometries.includes(partType)) {
    return {
      type: "flat_block",
      figure: "Figure 4",
      reasoning: "Flat block for round bar (radial inspection)"
    };
  } else if (partType === "hex_bar") {
    return {
      type: "flat_block",
      figure: "Figure 4",
      reasoning: "Flat block for hex bar (multi-face inspection)"
    };
  }
  
  // Default fallback
  return {
    type: "flat_block",
    figure: "Figure 4",
    reasoning: "Flat block (default for unknown geometry)"
  };
};

// Table VI - FBH sizes based on acceptance class
const selectFBHSizes = (acceptanceClass: AcceptanceClass): { 
  sizes: string[]; 
  reasoning: string;
} => {
  const fbhMap = {
    AAA: {
      sizes: ["1/64", "2/64", "3/64"],
      reasoning: "Class AAA requires smallest FBH (1/64\") for 25% of 3/64\" response, plus 2/64\" and 3/64\" per Table VI"
    },
    AA: {
      sizes: ["2/64", "3/64"],
      reasoning: "Class AA requires 3/64\" FBH with 2/64\" for multiple discontinuities per Table VI"
    },
    A: {
      sizes: ["3/64", "5/64"],
      reasoning: "Class A requires 5/64\" FBH with 3/64\" for multiple discontinuities per Table VI"
    },
    B: {
      sizes: ["5/64", "8/64"],
      reasoning: "Class B requires 8/64\" (1/8\") FBH with 5/64\" for multiple discontinuities per Table VI"
    },
    C: {
      sizes: ["8/64"],
      reasoning: "Class C requires 8/64\" (1/8\") FBH per Table VI"
    }
  };
  return fbhMap[acceptanceClass];
};

// Table IV - Metal travel calculation
const calculateMetalTravel = (thickness: number): {
  distances: number[];
  tolerance: string;
  reasoning: string;
} => {
  const thicknessInch = thickness / 25.4;
  
  if (thicknessInch <= 0.25) {
    return {
      distances: [thickness],
      tolerance: "±1.59mm (±1/16\")",
      reasoning: "Single travel distance for 0.25\" thickness with ±1/16\" tolerance per Table IV"
    };
  } else if (thicknessInch <= 1.0) {
    return {
      distances: [thickness, thickness * 2],
      tolerance: "±3.18mm (±1/8\")",
      reasoning: "Primary and 2× thickness travel with ±1/8\" tolerance per Table IV"
    };
  } else if (thicknessInch <= 3.0) {
    return {
      distances: [thickness, thickness * 2],
      tolerance: "±6.35mm (±1/4\")",
      reasoning: "Primary and 2× thickness travel with ±1/4\" tolerance per Table IV"
    };
  } else if (thicknessInch <= 6.0) {
    return {
      distances: [thickness, thickness * 2],
      tolerance: "±12.7mm (±1/2\")",
      reasoning: "Primary and 2× thickness travel with ±1/2\" tolerance per Table IV"
    };
  } else {
    return {
      distances: [thickness, thickness * 2],
      tolerance: `±${(thickness * 0.1).toFixed(1)}mm (±10%)`,
      reasoning: "Primary and 2× thickness travel with ±10% tolerance per Table IV"
    };
  }
};

// Table II - Frequency recommendation
const recommendFrequency = (thickness: number): {
  frequency: number;
  reasoning: string;
} => {
  if (thickness < 12.7) {
    return {
      frequency: 10.0,
      reasoning: "10 MHz recommended for thickness < 12.7mm per Table II"
    };
  } else if (thickness < 25.4) {
    return {
      frequency: 5.0,
      reasoning: "5 MHz recommended for thickness 12.7-25.4mm per Table II"
    };
  } else if (thickness < 50.8) {
    return {
      frequency: 2.25,
      reasoning: "2.25 MHz recommended for thickness 25.4-50.8mm per Table II"
    };
  } else {
    return {
      frequency: 1.0,
      reasoning: "1 MHz recommended for thickness > 50.8mm per Table II"
    };
  }
};

// Confidence calculation
const calculateConfidence = (input: CalibrationInput): number => {
  let confidence = 100;
  
  // Standard materials get full confidence
  const standardMaterials = [
    "7075-T6 (QQ-A200/11)", "2024 (QQ-A-200/3)",
    "4340 annealed (MIL-S-5000)",
    "Ti-6Al-4V annealed (AMS 4928)",
    "ZK60A (QQ-M-31)"
  ];
  
  if (!standardMaterials.includes(input.materialSpec)) {
    confidence -= 15;
  }
  
  // Extreme thicknesses reduce confidence
  if (input.thickness < 10 || input.thickness > 200) {
    confidence -= 10;
  }
  
  // Complex geometries reduce confidence slightly
  if (input.partType === "forging") {
    confidence -= 5;
  }
  
  return Math.max(confidence, 50);
};

// Generate 3D visualization data
const generate3DVisualization = (
  blockType: CalibrationBlockType,
  fbhSizes: string[],
  metalTravel: { distances: number[] }
): CalibrationRecommendation["visualization3D"] => {
  // Standard block dimensions (mm)
  const blockDimensions: [number, number, number] = 
    blockType === "flat_block" ? [150, 75, 50] : [100, 100, 75];
  
  // Position FBHs in the block
  const fbhPositions = fbhSizes.flatMap((size, sizeIndex) => 
    metalTravel.distances.map((depth, depthIndex) => ({
      size,
      depth,
      coordinates: [
        30 + sizeIndex * 40 - 40, // X spacing
        depth, // Y (depth)
        20 + depthIndex * 25 - 25  // Z spacing
      ] as [number, number, number]
    }))
  );
  
  return {
    blockDimensions,
    fbhPositions
  };
};

// Main recommendation function
export const generateCalibrationRecommendation = (
  input: CalibrationInput
): CalibrationRecommendation => {
  const material = getReferenceMaterial(input.material);
  const blockInfo = selectBlockType(input.partType, input.thickness);
  const fbhInfo = selectFBHSizes(input.acceptanceClass);
  const metalTravel = calculateMetalTravel(input.thickness);
  const freqInfo = recommendFrequency(input.thickness);
  const confidence = calculateConfidence(input);
  
  // Transducer diameter recommendation (Table III)
  const transducerDiameter = input.thickness < 25.4 ? "0.5 inch" : "0.75 inch";
  
  const visualization3D = generate3DVisualization(
    blockInfo.type,
    fbhInfo.sizes,
    metalTravel
  );
  
  return {
    standardType: blockInfo.type,
    referenceFigure: blockInfo.figure,
    material: material.primary,
    fbhSizes: fbhInfo.sizes,
    metalTravel: {
      distances: metalTravel.distances,
      tolerance: metalTravel.tolerance
    },
    frequency: freqInfo.frequency,
    transducerDiameter,
    reasoning: {
      material: `${material.primary} matches part material per Table I`,
      blockType: blockInfo.reasoning,
      fbh: fbhInfo.reasoning,
      frequency: freqInfo.reasoning,
      travel: metalTravel.reasoning
    },
    confidence,
    visualization3D
  };
};
