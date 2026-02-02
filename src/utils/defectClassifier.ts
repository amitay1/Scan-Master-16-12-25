// @ts-nocheck
/**
 * AI Defect Classifier
 * Rules-based classification engine for UT indications
 */

import type {
  IndicationData,
  DefectClassification,
  DefectType,
  DefectCharacteristics,
} from "@/types/defect";
import { DEFECT_CHARACTERISTICS, DEFECT_TYPE_LABELS } from "@/types/defect";

interface MatchScore {
  type: DefectType;
  score: number;
  maxScore: number;
  matchingFactors: string[];
  conflictingFactors: string[];
}

/**
 * Main classification function
 */
export function classifyIndication(data: IndicationData): DefectClassification {
  // Calculate match scores for all defect types
  const scores = DEFECT_CHARACTERISTICS.map((char) =>
    calculateMatchScore(data, char)
  );

  // Sort by score percentage
  scores.sort((a, b) => b.score / b.maxScore - a.score / a.maxScore);

  // Get primary classification
  const primary = scores[0];
  const primaryConfidence = Math.round((primary.score / primary.maxScore) * 100);

  // Get alternatives (above 30% confidence)
  const alternatives = scores
    .slice(1)
    .filter((s) => s.score / s.maxScore > 0.3)
    .slice(0, 3)
    .map((s) => ({
      type: s.type,
      confidence: Math.round((s.score / s.maxScore) * 100),
    }));

  // Generate recommendation
  const { recommendation, reason } = generateRecommendation(
    data,
    primary.type,
    primaryConfidence
  );

  // Generate suggested actions
  const suggestedActions = generateSuggestedActions(
    data,
    primary.type,
    primaryConfidence
  );

  // Generate references
  const references = generateReferences(data, primary.type);

  return {
    primaryType: primary.type,
    confidence: primaryConfidence,
    alternativeTypes: alternatives,
    reasons: generateReasons(data, primary),
    matchingCharacteristics: primary.matchingFactors,
    conflictingCharacteristics: primary.conflictingFactors,
    recommendation,
    recommendationReason: reason,
    suggestedActions,
    references,
  };
}

/**
 * Calculate match score for a defect type
 */
function calculateMatchScore(
  data: IndicationData,
  char: DefectCharacteristics
): MatchScore {
  let score = 0;
  let maxScore = 0;
  const matchingFactors: string[] = [];
  const conflictingFactors: string[] = [];

  // Signal shape (weight: 3)
  maxScore += 3;
  if (char.typicalSignalShapes.includes(data.signalShape)) {
    score += 3;
    matchingFactors.push(`Signal shape (${data.signalShape}) matches typical pattern`);
  } else {
    conflictingFactors.push(`Signal shape (${data.signalShape}) not typical for ${char.type}`);
  }

  // Signal behavior (weight: 2)
  maxScore += 2;
  if (char.typicalBehaviors.includes(data.signalBehavior)) {
    score += 2;
    matchingFactors.push(`Signal behavior (${data.signalBehavior}) is characteristic`);
  } else {
    conflictingFactors.push(`Signal behavior unusual for ${char.type}`);
  }

  // Back wall effect (weight: 3)
  if (data.backWallDrop !== undefined || data.backWallComplete !== undefined) {
    maxScore += 3;
    const hasBackWallEffect = (data.backWallDrop && data.backWallDrop > 3) || data.backWallComplete;

    if (char.backWallEffect === "complete_loss" && data.backWallComplete) {
      score += 3;
      matchingFactors.push("Complete back wall loss matches");
    } else if (char.backWallEffect === "partial_drop" && data.backWallDrop && data.backWallDrop > 3) {
      score += 3;
      matchingFactors.push(`Back wall drop of ${data.backWallDrop}dB matches`);
    } else if (char.backWallEffect === "none" && !hasBackWallEffect) {
      score += 3;
      matchingFactors.push("No back wall effect as expected");
    } else if (char.backWallEffect === "variable") {
      score += 1.5; // Partial match for variable
    } else {
      conflictingFactors.push("Back wall effect does not match expected pattern");
    }
  }

  // Location (weight: 2)
  maxScore += 2;
  const location = getIndicationLocation(data);
  if (char.typicalLocations.includes(location)) {
    score += 2;
    matchingFactors.push(`Location (${location}) is typical`);
  } else {
    score += 0.5; // Small penalty, location is not always deterministic
    conflictingFactors.push(`Location (${location}) less common for ${char.type}`);
  }

  // Orientation (weight: 2)
  if (data.orientation && data.orientation !== "unknown") {
    maxScore += 2;
    if (char.typicalOrientation.includes(data.orientation)) {
      score += 2;
      matchingFactors.push(`Orientation (${data.orientation}) matches`);
    } else if (char.typicalOrientation.includes("random")) {
      score += 1; // Random orientation can match anything
    } else {
      conflictingFactors.push(`Orientation not typical for ${char.type}`);
    }
  }

  // Process association (weight: 2)
  if (data.processType) {
    maxScore += 2;
    if (
      char.processAssociation.includes(data.processType) ||
      char.processAssociation.includes("any")
    ) {
      score += 2;
      matchingFactors.push(`Process type (${data.processType}) commonly produces this defect`);
    } else {
      score += 0.5;
      conflictingFactors.push(`Less common in ${data.processType} process`);
    }
  }

  // Linear indication (weight: 1)
  if (data.isLinear !== undefined) {
    maxScore += 1;
    const linearDefects: DefectType[] = ["crack", "lack_of_fusion", "lack_of_penetration", "seam", "forging_lap"];
    const isLinearDefect = linearDefects.includes(char.type);

    if (data.isLinear === isLinearDefect) {
      score += 1;
      if (data.isLinear) {
        matchingFactors.push("Linear nature consistent with defect type");
      }
    } else {
      conflictingFactors.push(
        data.isLinear
          ? "Linear indication unusual for this defect type"
          : "Expected linear indication but found non-linear"
      );
    }
  }

  // Angle beam response (weight: 2)
  if (data.angleResponse) {
    maxScore += 2;
    const hasStrongAngleResponse =
      (data.angleResponse.angle45 && data.angleResponse.angle45 > 50) ||
      (data.angleResponse.angle60 && data.angleResponse.angle60 > 50) ||
      (data.angleResponse.angle70 && data.angleResponse.angle70 > 50);

    // Cracks and planar defects typically show strong angle response
    const planarDefects: DefectType[] = ["crack", "lack_of_fusion", "delamination", "lamination"];

    if (planarDefects.includes(char.type) && hasStrongAngleResponse) {
      score += 2;
      matchingFactors.push("Strong angle beam response typical of planar defects");
    } else if (!planarDefects.includes(char.type) && !hasStrongAngleResponse) {
      score += 2;
      matchingFactors.push("Angle beam response consistent with volumetric defect");
    } else if (planarDefects.includes(char.type) && !hasStrongAngleResponse) {
      score += 0.5;
      conflictingFactors.push("Expected stronger angle beam response");
    }
  }

  // Amplitude-based hints (weight: 1)
  maxScore += 1;
  if (data.amplitude > 200) {
    // Very high amplitude
    const highAmpDefects: DefectType[] = ["crack", "void", "delamination", "lamination"];
    if (highAmpDefects.includes(char.type)) {
      score += 1;
      matchingFactors.push("High amplitude consistent with large reflector");
    }
  } else if (data.amplitude < 50) {
    // Low amplitude
    const lowAmpDefects: DefectType[] = ["porosity", "inclusion", "segregation"];
    if (lowAmpDefects.includes(char.type)) {
      score += 1;
      matchingFactors.push("Lower amplitude consistent with volumetric or scattered defects");
    }
  } else {
    score += 0.5; // Neutral amplitude
  }

  return {
    type: char.type,
    score,
    maxScore,
    matchingFactors,
    conflictingFactors,
  };
}

/**
 * Determine indication location category
 */
function getIndicationLocation(
  data: IndicationData
): "surface" | "subsurface" | "midwall" | "backwall" {
  if (data.nearSurface) return "surface";
  if (data.nearBackWall) return "backwall";
  if (data.atMidwall) return "midwall";

  // Estimate from depth if available
  // Assuming typical part thickness context
  if (data.depth < 3) return "surface";
  if (data.depth < 10) return "subsurface";
  return "midwall";
}

/**
 * Generate recommendation based on classification
 */
function generateRecommendation(
  data: IndicationData,
  defectType: DefectType,
  confidence: number
): { recommendation: "accept" | "reject" | "retest" | "evaluate_further"; reason: string } {
  // Critical defect types always need attention
  const criticalDefects: DefectType[] = ["crack", "lack_of_fusion", "lack_of_penetration"];

  if (criticalDefects.includes(defectType) && data.amplitude > 100) {
    return {
      recommendation: "reject",
      reason: `${DEFECT_TYPE_LABELS[defectType]} above rejection threshold - recommend rejection per applicable specification`,
    };
  }

  if (confidence < 50) {
    return {
      recommendation: "evaluate_further",
      reason: "Low classification confidence - recommend additional evaluation by Level III",
    };
  }

  if (data.amplitude > 100) {
    return {
      recommendation: "reject",
      reason: `Amplitude (${data.amplitude}%) exceeds typical acceptance threshold`,
    };
  }

  if (data.amplitude > 50) {
    return {
      recommendation: "evaluate_further",
      reason: "Recordable indication - evaluate against specific acceptance criteria",
    };
  }

  return {
    recommendation: "accept",
    reason: "Indication below typical recording threshold",
  };
}

/**
 * Generate suggested follow-up actions
 */
function generateSuggestedActions(
  data: IndicationData,
  defectType: DefectType,
  confidence: number
): string[] {
  const actions: string[] = [];

  if (confidence < 70) {
    actions.push("Perform additional scans from orthogonal directions");
    actions.push("Consider angle beam examination to better characterize");
  }

  if (defectType === "crack" || defectType === "lack_of_fusion") {
    actions.push("Document indication location with dimensional sketch");
    actions.push("Capture A-scan signature for records");
    if (!data.angleResponse) {
      actions.push("Perform angle beam scan to determine orientation and extent");
    }
  }

  if (defectType === "porosity" && data.amplitude > 50) {
    actions.push("Map extent of porosity cluster");
    actions.push("Evaluate cumulative area against acceptance criteria");
  }

  if (data.isLinear && data.linearLength && data.linearLength > 10) {
    actions.push("Determine full linear extent of indication");
    actions.push("Check for multiple aligned indications");
  }

  if (!data.backWallDrop && !data.backWallComplete) {
    actions.push("Verify back wall signal and note any attenuation");
  }

  // Material-specific
  if (data.material?.toLowerCase().includes("titanium")) {
    actions.push("Evaluate for alpha case or noise patterns specific to titanium");
  }

  return actions;
}

/**
 * Generate standard references
 */
function generateReferences(
  data: IndicationData,
  defectType: DefectType
): string[] {
  const refs: string[] = [];

  // General references
  refs.push("ASTM E2375 - Standard Practice for Ultrasonic Testing of Wrought Products");

  if (data.processType === "weld") {
    refs.push("AWS D1.1 - Structural Welding Code");
    refs.push("ASME Section V Article 4 - Ultrasonic Examination Methods for Welds");
  }

  if (data.processType === "forging") {
    refs.push("ASTM A388 - Standard Practice for Ultrasonic Examination of Steel Forgings");
    refs.push("AMS-STD-2154 - Inspection, Ultrasonic, Wrought Metals");
  }

  if (data.processType === "casting") {
    refs.push("ASTM A609 - Standard Practice for Castings, Carbon, Low-Alloy, and Martensitic Stainless Steel");
  }

  // Defect-specific
  if (defectType === "hydrogen_flake") {
    refs.push("ASTM E428 - Standard Practice for Fabrication and Control of Metal Reference Blocks");
  }

  return refs;
}

/**
 * Generate human-readable reasons for classification
 */
function generateReasons(data: IndicationData, match: MatchScore): string[] {
  const reasons: string[] = [];

  // Primary reasoning
  reasons.push(
    `Primary classification: ${DEFECT_TYPE_LABELS[match.type]} with ${Math.round(
      (match.score / match.maxScore) * 100
    )}% confidence`
  );

  // Add top matching factors
  if (match.matchingFactors.length > 0) {
    reasons.push("Supporting evidence:");
    match.matchingFactors.slice(0, 4).forEach((f) => {
      reasons.push(`  • ${f}`);
    });
  }

  // Note conflicts if any
  if (match.conflictingFactors.length > 0 && match.score / match.maxScore < 0.8) {
    reasons.push("Note: Some characteristics do not fully match:");
    match.conflictingFactors.slice(0, 2).forEach((f) => {
      reasons.push(`  • ${f}`);
    });
  }

  return reasons;
}

/**
 * Get quick classification without full analysis
 */
export function quickClassify(
  signalShape: string,
  backWallDrop: number,
  processType?: string
): DefectType {
  // Simple heuristic for quick classification
  if (signalShape === "sharp_narrow" && backWallDrop > 6) {
    return "crack";
  }
  if (signalShape === "rounded" || signalShape === "multiple_peaks") {
    return processType === "casting" ? "porosity" : "inclusion";
  }
  if (signalShape === "flat_topped" && backWallDrop > 12) {
    return "delamination";
  }
  if (processType === "weld" && signalShape === "sharp_narrow") {
    return "lack_of_fusion";
  }

  return "unknown";
}

/**
 * Validate indication data completeness
 */
export function validateIndicationData(data: Partial<IndicationData>): {
  valid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  if (data.amplitude === undefined) {
    missingFields.push("amplitude");
  }
  if (!data.amplitudeReference) {
    missingFields.push("amplitudeReference");
  }
  if (data.depth === undefined) {
    missingFields.push("depth");
  }
  if (!data.signalShape) {
    missingFields.push("signalShape");
  }
  if (!data.signalBehavior) {
    missingFields.push("signalBehavior");
  }

  // Warnings for optional but helpful fields
  if (data.backWallDrop === undefined && data.backWallComplete === undefined) {
    warnings.push("Back wall information not provided - may affect accuracy");
  }
  if (!data.processType) {
    warnings.push("Process type not specified - using general classification");
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
    warnings,
  };
}
