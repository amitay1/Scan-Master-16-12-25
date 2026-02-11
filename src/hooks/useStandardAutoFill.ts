import { useEffect, Dispatch, SetStateAction } from "react";
import type {
  StandardType,
  InspectionSetupData,
  EquipmentData,
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  MaterialType,
} from "@/types/techniqueSheet";
import { standardRules, getRecommendedFrequency, getCouplantRecommendation, calculateMetalTravel } from "@/utils/enhancedAutoFillLogic";
import { getDefaultAcceptanceClass } from "@/data/standardsDifferences";
import { getInspectionThickness } from "@/utils/inspectionThickness";

const FIXED_FREQUENCY_STANDARDS: StandardType[] = [
  "NDIP-1226",
  "NDIP-1227",
  "NDIP-1254",
  "NDIP-1257",
  "NDIP-1260",
];

interface UseStandardAutoFillParams {
  standard: StandardType;
  isSplitMode: boolean;
  activePart: "A" | "B";
  // Part A
  inspectionSetup: InspectionSetupData;
  equipment: EquipmentData;
  calibration: CalibrationData;
  scanParameters: ScanParametersData;
  acceptanceCriteria: AcceptanceCriteriaData;
  setEquipment: Dispatch<SetStateAction<EquipmentData>>;
  setCalibration: Dispatch<SetStateAction<CalibrationData>>;
  setScanParameters: Dispatch<SetStateAction<ScanParametersData>>;
  setAcceptanceCriteria: Dispatch<SetStateAction<AcceptanceCriteriaData>>;
  // Part B
  inspectionSetupB: InspectionSetupData;
  equipmentB: EquipmentData;
  setEquipmentB: Dispatch<SetStateAction<EquipmentData>>;
  setCalibrationB: Dispatch<SetStateAction<CalibrationData>>;
  setScanParametersB: Dispatch<SetStateAction<ScanParametersData>>;
  setAcceptanceCriteriaB: Dispatch<SetStateAction<AcceptanceCriteriaData>>;
}

export function useStandardAutoFill({
  standard,
  isSplitMode,
  activePart,
  inspectionSetup,
  equipment,
  setEquipment,
  setCalibration,
  setScanParameters,
  setAcceptanceCriteria,
  inspectionSetupB,
  equipmentB,
  setEquipmentB,
  setCalibrationB,
  setScanParametersB,
  setAcceptanceCriteriaB,
}: UseStandardAutoFillParams) {
  // Auto-fill when standard changes
  useEffect(() => {
    if (standard && standardRules[standard]) {
      const rules = standardRules[standard];
      const defaultClass = getDefaultAcceptanceClass(standard);
      if (!isSplitMode || activePart === "A") {
        setAcceptanceCriteria(prev => ({
          ...prev,
          acceptanceClass: prev.acceptanceClass || (defaultClass as any),
        }));
        setScanParameters(prev => ({
          ...prev,
          coverage: prev.coverage === 100 ? rules.scanCoverageDefault : prev.coverage,
        }));
      } else {
        setAcceptanceCriteriaB(prev => ({
          ...prev,
          acceptanceClass: prev.acceptanceClass || (defaultClass as any),
        }));
        setScanParametersB(prev => ({
          ...prev,
          coverage: prev.coverage === 100 ? rules.scanCoverageDefault : prev.coverage,
        }));
      }
    }
  }, [standard, isSplitMode, activePart, setAcceptanceCriteria, setScanParameters, setAcceptanceCriteriaB, setScanParametersB]);

  // Auto-fill frequency when material changes – Part A
  useEffect(() => {
    if (FIXED_FREQUENCY_STANDARDS.includes(standard)) {
      if (equipment.frequency !== "5.0") {
        setEquipment(prev => ({ ...prev, frequency: "5.0" }));
      }
      return;
    }

    const inspectionThickness = getInspectionThickness(inspectionSetup, 0);
    if (inspectionSetup.material && inspectionThickness > 0) {
      const recommendedFreq = getRecommendedFrequency(
        inspectionThickness,
        inspectionSetup.material as MaterialType,
      );
      if (equipment.frequency === "5.0" || !equipment.frequency) {
        setEquipment(prev => ({ ...prev, frequency: recommendedFreq }));
      }
      const metalTravel = calculateMetalTravel(inspectionThickness);
      setCalibration(prev => ({
        ...prev,
        metalTravelDistance: prev.metalTravelDistance === 0 ? metalTravel : prev.metalTravelDistance,
      }));
    }
  }, [
    inspectionSetup.material,
    inspectionSetup.partType,
    inspectionSetup.partThickness,
    inspectionSetup.wallThickness,
    inspectionSetup.isHollow,
    inspectionSetup.diameter,
    inspectionSetup.innerDiameter,
    standard,
    equipment.frequency,
    setEquipment,
    setCalibration,
  ]);

  // Auto-fill frequency when material changes – Part B
  useEffect(() => {
    if (FIXED_FREQUENCY_STANDARDS.includes(standard)) {
      if (isSplitMode && equipmentB.frequency !== "5.0") {
        setEquipmentB(prev => ({ ...prev, frequency: "5.0" }));
      }
      return;
    }

    const inspectionThickness = getInspectionThickness(inspectionSetupB, 0);
    if (isSplitMode && inspectionSetupB.material && inspectionThickness > 0) {
      const recommendedFreq = getRecommendedFrequency(
        inspectionThickness,
        inspectionSetupB.material as MaterialType,
      );
      if (equipmentB.frequency === "5.0" || !equipmentB.frequency) {
        setEquipmentB(prev => ({ ...prev, frequency: recommendedFreq }));
      }
      const metalTravel = calculateMetalTravel(inspectionThickness);
      setCalibrationB(prev => ({
        ...prev,
        metalTravelDistance: prev.metalTravelDistance === 0 ? metalTravel : prev.metalTravelDistance,
      }));
    }
  }, [
    isSplitMode,
    inspectionSetupB.material,
    inspectionSetupB.partType,
    inspectionSetupB.partThickness,
    inspectionSetupB.wallThickness,
    inspectionSetupB.isHollow,
    inspectionSetupB.diameter,
    inspectionSetupB.innerDiameter,
    standard,
    equipmentB.frequency,
    setEquipmentB,
    setCalibrationB,
  ]);

  // Auto-fill couplant – Part A
  useEffect(() => {
    if (equipment.transducerType && inspectionSetup.material) {
      const recommendedCouplant = getCouplantRecommendation(
        equipment.transducerType,
        inspectionSetup.material as MaterialType,
      );
      setEquipment(prev => ({ ...prev, couplant: prev.couplant || recommendedCouplant }));
    }
  }, [equipment.transducerType, inspectionSetup.material, setEquipment]);

  // Auto-fill couplant – Part B
  useEffect(() => {
    if (isSplitMode && equipmentB.transducerType && inspectionSetupB.material) {
      const recommendedCouplant = getCouplantRecommendation(
        equipmentB.transducerType,
        inspectionSetupB.material as MaterialType,
      );
      setEquipmentB(prev => ({ ...prev, couplant: prev.couplant || recommendedCouplant }));
    }
  }, [isSplitMode, equipmentB.transducerType, inspectionSetupB.material, setEquipmentB]);
}
