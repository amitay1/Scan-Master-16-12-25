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
    if (inspectionSetup.material && inspectionSetup.partThickness) {
      const recommendedFreq = getRecommendedFrequency(
        inspectionSetup.partThickness,
        inspectionSetup.material as MaterialType,
      );
      if (equipment.frequency === "5.0" || !equipment.frequency) {
        setEquipment(prev => ({ ...prev, frequency: recommendedFreq }));
      }
      const metalTravel = calculateMetalTravel(inspectionSetup.partThickness);
      setCalibration(prev => ({
        ...prev,
        metalTravelDistance: prev.metalTravelDistance === 0 ? metalTravel : prev.metalTravelDistance,
      }));
    }
  }, [inspectionSetup.material, inspectionSetup.partThickness, equipment.frequency, setEquipment, setCalibration]);

  // Auto-fill frequency when material changes – Part B
  useEffect(() => {
    if (isSplitMode && inspectionSetupB.material && inspectionSetupB.partThickness) {
      const recommendedFreq = getRecommendedFrequency(
        inspectionSetupB.partThickness,
        inspectionSetupB.material as MaterialType,
      );
      if (equipmentB.frequency === "5.0" || !equipmentB.frequency) {
        setEquipmentB(prev => ({ ...prev, frequency: recommendedFreq }));
      }
      const metalTravel = calculateMetalTravel(inspectionSetupB.partThickness);
      setCalibrationB(prev => ({
        ...prev,
        metalTravelDistance: prev.metalTravelDistance === 0 ? metalTravel : prev.metalTravelDistance,
      }));
    }
  }, [isSplitMode, inspectionSetupB.material, inspectionSetupB.partThickness, equipmentB.frequency, setEquipmentB, setCalibrationB]);

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
