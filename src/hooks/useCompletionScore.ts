import { useMemo } from "react";
import type { CurrentPartData } from "@/hooks/useTechniqueSheetState";

interface UseCompletionScoreParams {
  currentData: CurrentPartData;
  reportMode: "Technique" | "Report";
}

export function useCompletionScore({ currentData, reportMode }: UseCompletionScoreParams) {
  const completionPercent = useMemo(() => {
    let score = 0;
    const maxScore = 85;

    // CRITICAL FIELDS (5 points each)
    if (currentData.inspectionSetup.partNumber) score += 5;
    if (currentData.inspectionSetup.material) score += 5;
    if (currentData.inspectionSetup.partType) score += 5;
    if (currentData.inspectionSetup.partThickness >= 6.35) score += 5;
    if (currentData.acceptanceCriteria.acceptanceClass) score += 5;
    if (currentData.equipment.frequency) score += 5;

    // HIGH PRIORITY FIELDS (3 points each)
    if (currentData.equipment.transducerType) score += 3;
    if (currentData.equipment.transducerDiameter) score += 3;
    if (currentData.equipment.verticalLinearity) score += 3;
    if (currentData.equipment.horizontalLinearity) score += 3;
    if (currentData.calibration.standardType) score += 3;
    if (currentData.calibration.fbhSizes) score += 3;
    if (currentData.calibration.metalTravelDistance) score += 3;
    if (currentData.scanParameters.coverage) score += 3;

    // MEDIUM PRIORITY FIELDS (2 points each)
    if (currentData.scanParameters.scanMethod) score += 2;
    if (currentData.scanParameters.scanType) score += 2;
    if (currentData.scanParameters.scanSpeed) score += 2;
    if (currentData.scanParameters.scanIndex) score += 2;
    if (currentData.scanParameters.scanPattern) score += 2;
    if (currentData.equipment.couplant) score += 2;
    if (currentData.calibration.referenceMaterial) score += 2;
    if (currentData.acceptanceCriteria.singleDiscontinuity) score += 2;
    if (currentData.acceptanceCriteria.multipleDiscontinuities) score += 2;
    if (currentData.acceptanceCriteria.linearDiscontinuity) score += 2;

    // LOW PRIORITY FIELDS (1 point each)
    if (currentData.inspectionSetup.partName) score += 1;
    if (currentData.inspectionSetup.materialSpec) score += 1;
    if (currentData.equipment.manufacturer) score += 1;
    if (currentData.equipment.model) score += 1;
    if (currentData.acceptanceCriteria.backReflectionLoss) score += 1;
    if (currentData.acceptanceCriteria.noiseLevel) score += 1;
    if (currentData.documentation.inspectorName) score += 1;
    if (currentData.documentation.inspectorCertification) score += 1;
    if (currentData.documentation.inspectorLevel) score += 1;
    if (currentData.documentation.inspectionDate) score += 1;
    if (currentData.documentation.revision) score += 1;

    return (score / maxScore) * 100;
  }, [currentData]);

  const completedFieldsCount = useMemo(() => {
    const totalFields = reportMode === "Technique" ? 50 : 40;
    return Math.round((completionPercent / 100) * totalFields);
  }, [completionPercent, reportMode]);

  return { completionPercent, completedFieldsCount };
}
