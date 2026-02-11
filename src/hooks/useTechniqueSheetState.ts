import { useState, useMemo, useCallback, Dispatch, SetStateAction } from "react";
import type {
  StandardType,
  InspectionSetupData,
  EquipmentData,
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  DocumentationData,
  ScanPlanData,
} from "@/types/techniqueSheet";
import type { ScanDetailsData } from "@/types/scanDetails";
import { InspectionReportData, getDefaultInspectionReportData } from "@/types/inspectionReport";
import type { TechniqueSheetCardData, TechniqueSheetRecord } from "@/services/techniqueSheetService";
import type { SavedCard } from "@/contexts/SavedCardsContext";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import {
  acceptanceClassesByStandard,
  acceptanceCriteriaByStandard,
  calibrationByStandard,
  getDefaultAcceptanceClass,
  getFBHSizeForStandard,
  scanParametersByStandard,
} from "@/data/standardsDifferences";
import { PW_ANGLE_CALIBRATION_BLOCK } from "@/rules/pw/pwCalibrationBlocks";

// ג”€ג”€ Default initial values ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€

const defaultInspectionSetup: InspectionSetupData = {
  partNumber: "",
  partName: "",
  material: "",
  materialSpec: "",
  partType: "",
  partThickness: 25.0,
  partLength: 100.0,
  partWidth: 50.0,
  diameter: 0,
};

const defaultEquipment: EquipmentData = {
  manufacturer: "",
  model: "",
  serialNumber: "",
  frequency: "5.0",
  transducerType: "",
  transducerDiameter: 0.5,
  couplant: "",
  verticalLinearity: 95,
  horizontalLinearity: 85,
  entrySurfaceResolution: 0.125,
  backSurfaceResolution: 0.05,
};

const defaultCalibration: CalibrationData = {
  standardType: "",
  referenceMaterial: "",
  fbhSizes: "",
  metalTravelDistance: 0,
  blockDimensions: "",
  blockSerialNumber: "",
  lastCalibrationDate: "",
};

const defaultScanParameters: ScanParametersData = {
  scanMethod: "",
  scanMethods: [],
  technique: "conventional",
  scanType: "",
  scanSpeed: 100,
  scanIndex: 70,
  coverage: 100,
  scanPattern: "",
  waterPath: 0,
  pulseRepetitionRate: 1000,
  gainSettings: "",
  alarmGateSettings: "",
};

const defaultAcceptanceCriteria: AcceptanceCriteriaData = {
  acceptanceClass: "",
  singleDiscontinuity: "",
  multipleDiscontinuities: "",
  linearDiscontinuity: "",
  backReflectionLoss: 50,
  noiseLevel: "",
  specialRequirements: "",
};

const defaultDocumentation = (): DocumentationData => ({
  inspectorName: "",
  inspectorCertification: "",
  inspectorLevel: "",
  certifyingOrganization: "",
  inspectionDate: new Date().toISOString().split("T")[0],
  procedureNumber: "",
  drawingReference: "",
  revision: "A",
  additionalNotes: "",
  approvalRequired: false,
});

const defaultScanDetails: ScanDetailsData = { scanDetails: [] };

const defaultScanPlan: ScanPlanData = {
  documents: [
    {
      id: "scan-plan-1",
      title: "UT Scan Planning Guide",
      description: "Complete guide for scan planning and execution",
      filePath: "/documents/scan-plan-guide.docx",
      category: "Planning",
      order: 1,
      isActive: true,
    },
    {
      id: "tcg-calibration",
      title: "TCG for Shear Wave Calibration",
      description: "Time Corrected Gain calibration procedures for shear wave testing",
      filePath: "/documents/tcg-shear-wave-calibration.docx",
      category: "Calibration",
      order: 2,
      isActive: true,
    },
  ],
};

// ג”€ג”€ Current-data shape returned by currentData useMemo ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€

export interface CurrentPartData {
  inspectionSetup: InspectionSetupData;
  equipment: EquipmentData;
  calibration: CalibrationData;
  scanParameters: ScanParametersData;
  acceptanceCriteria: AcceptanceCriteriaData;
  documentation: DocumentationData;
  scanDetails: ScanDetailsData;
  scanPlan: ScanPlanData;
  setInspectionSetup: Dispatch<SetStateAction<InspectionSetupData>>;
  setEquipment: Dispatch<SetStateAction<EquipmentData>>;
  setCalibration: Dispatch<SetStateAction<CalibrationData>>;
  setScanParameters: Dispatch<SetStateAction<ScanParametersData>>;
  setAcceptanceCriteria: Dispatch<SetStateAction<AcceptanceCriteriaData>>;
  setDocumentation: Dispatch<SetStateAction<DocumentationData>>;
  setScanDetails: Dispatch<SetStateAction<ScanDetailsData>>;
  setScanPlan: Dispatch<SetStateAction<ScanPlanData>>;
}

// ג”€ג”€ Hook params ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€

interface UseTechniqueSheetStateParams {
  standard: StandardType;
  isSplitMode: boolean;
  activePart: "A" | "B";
  reportMode: "Technique" | "Report";
  activeTab: string;
  // Setters that live in Index (UI-level state)
  setStandard: Dispatch<SetStateAction<StandardType>>;
  setActiveTab: Dispatch<SetStateAction<string>>;
  setReportMode: Dispatch<SetStateAction<"Technique" | "Report">>;
  setIsSplitMode: Dispatch<SetStateAction<boolean>>;
  setActivePart: Dispatch<SetStateAction<"A" | "B">>;
}

export function useTechniqueSheetState({
  isSplitMode,
  activePart,
  standard,
  activeTab,
  reportMode,
  setStandard,
  setActiveTab,
  setReportMode,
  setIsSplitMode,
  setActivePart,
}: UseTechniqueSheetStateParams) {
  // ג”€ג”€ Part A state ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
  const [inspectionSetup, setInspectionSetup] = useState<InspectionSetupData>({ ...defaultInspectionSetup });
  const [equipment, setEquipment] = useState<EquipmentData>({ ...defaultEquipment });
  const [calibration, setCalibration] = useState<CalibrationData>({ ...defaultCalibration });
  const [scanParameters, setScanParameters] = useState<ScanParametersData>({ ...defaultScanParameters });
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<AcceptanceCriteriaData>({ ...defaultAcceptanceCriteria });
  const [documentation, setDocumentation] = useState<DocumentationData>(defaultDocumentation());
  const [scanDetails, setScanDetails] = useState<ScanDetailsData>({ ...defaultScanDetails });
  const [scanPlan, setScanPlan] = useState<ScanPlanData>(JSON.parse(JSON.stringify(defaultScanPlan)));

  // ג”€ג”€ Part B state ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
  const [inspectionSetupB, setInspectionSetupB] = useState<InspectionSetupData>({ ...defaultInspectionSetup });
  const [equipmentB, setEquipmentB] = useState<EquipmentData>({ ...defaultEquipment });
  const [calibrationB, setCalibrationB] = useState<CalibrationData>({ ...defaultCalibration });
  const [scanParametersB, setScanParametersB] = useState<ScanParametersData>({ ...defaultScanParameters });
  const [acceptanceCriteriaB, setAcceptanceCriteriaB] = useState<AcceptanceCriteriaData>({ ...defaultAcceptanceCriteria });
  const [documentationB, setDocumentationB] = useState<DocumentationData>(defaultDocumentation());
  const [scanDetailsB, setScanDetailsB] = useState<ScanDetailsData>({ ...defaultScanDetails });
  const [scanPlanB, setScanPlanB] = useState<ScanPlanData>(JSON.parse(JSON.stringify(defaultScanPlan)));

  // ג”€ג”€ Inspection Report state ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
  const [inspectionReport, setInspectionReport] = useState<InspectionReportData>(getDefaultInspectionReportData());

  // ג”€ג”€ currentData ג€“ picks A or B depending on split mode ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
  const currentData: CurrentPartData = useMemo(() => {
    if (!isSplitMode || activePart === "A") {
      return {
        inspectionSetup, equipment, calibration, scanParameters,
        acceptanceCriteria, documentation, scanDetails, scanPlan,
        setInspectionSetup, setEquipment, setCalibration, setScanParameters,
        setAcceptanceCriteria, setDocumentation, setScanDetails, setScanPlan,
      };
    }
    return {
      inspectionSetup: inspectionSetupB, equipment: equipmentB,
      calibration: calibrationB, scanParameters: scanParametersB,
      acceptanceCriteria: acceptanceCriteriaB, documentation: documentationB,
      scanDetails: scanDetailsB, scanPlan: scanPlanB,
      setInspectionSetup: setInspectionSetupB, setEquipment: setEquipmentB,
      setCalibration: setCalibrationB, setScanParameters: setScanParametersB,
      setAcceptanceCriteria: setAcceptanceCriteriaB, setDocumentation: setDocumentationB,
      setScanDetails: setScanDetailsB, setScanPlan: setScanPlanB,
    };
  }, [
    isSplitMode, activePart,
    inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria, documentation, scanDetails, scanPlan,
    inspectionSetupB, equipmentB, calibrationB, scanParametersB, acceptanceCriteriaB, documentationB, scanDetailsB, scanPlanB,
  ]);

  // ג”€ג”€ Copy Part A ג†’ B ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
  const copyPartAToB = useCallback(() => {
    setInspectionSetupB({ ...inspectionSetup });
    setEquipmentB({ ...equipment });
    setCalibrationB({ ...calibration });
    setScanParametersB({ ...scanParameters });
    setAcceptanceCriteriaB({ ...acceptanceCriteria });
    setDocumentationB({ ...documentation });
    setScanDetailsB({ ...scanDetails });
    toast.success("Part A copied to Part B");
  }, [inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria, documentation, scanDetails]);

  // ג”€ג”€ Build payload for DB save ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
  const buildTechniqueSheetPayload = useCallback((): TechniqueSheetCardData => ({
    standard,
    activeTab,
    reportMode,
    isSplitMode,
    activePart,
    partA: {
      inspectionSetup, equipment, calibration, scanParameters,
      acceptanceCriteria, documentation, scanDetails,
    },
    partB: {
      inspectionSetup: inspectionSetupB, equipment: equipmentB,
      calibration: calibrationB, scanParameters: scanParametersB,
      acceptanceCriteria: acceptanceCriteriaB, documentation: documentationB,
      scanDetails: scanDetailsB,
    },
    inspectionReport,
  }), [
    standard, activeTab, reportMode, isSplitMode, activePart,
    inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria, documentation, scanDetails,
    inspectionSetupB, equipmentB, calibrationB, scanParametersB, acceptanceCriteriaB, documentationB, scanDetailsB,
    inspectionReport,
  ]);

  // ג”€ג”€ Build card data for local save ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
  const buildCardData = useCallback(() => ({
    standard,
    activeTab,
    reportMode,
    isSplitMode,
    activePart,
    partA: {
      inspectionSetup, equipment, calibration, scanParameters,
      acceptanceCriteria, documentation, scanDetails,
    },
    partB: isSplitMode ? {
      inspectionSetup: inspectionSetupB, equipment: equipmentB,
      calibration: calibrationB, scanParameters: scanParametersB,
      acceptanceCriteria: acceptanceCriteriaB, documentation: documentationB,
      scanDetails: scanDetailsB,
    } : undefined,
    inspectionReport: reportMode === "Report" ? inspectionReport : undefined,
  }), [
    standard, activeTab, reportMode, isSplitMode, activePart,
    inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria, documentation, scanDetails,
    inspectionSetupB, equipmentB, calibrationB, scanParametersB, acceptanceCriteriaB, documentationB, scanDetailsB,
    inspectionReport,
  ]);

  // ג”€ג”€ Apply loaded sheet (from DB) ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
  const applyLoadedSheet = useCallback((record: TechniqueSheetRecord) => {
    const data = record.data;
    if (!data) {
      toast.error("Saved card is missing data.");
      return;
    }

    setStandard(data.standard || "AMS-STD-2154E");
    setActiveTab(data.activeTab || "setup");
    setReportMode(data.reportMode || "Technique");
    setIsSplitMode(Boolean(data.isSplitMode));
    setActivePart(data.activePart || "A");

    setInspectionSetup(data.partA?.inspectionSetup || { ...defaultInspectionSetup });
    setEquipment(data.partA?.equipment || { ...defaultEquipment });
    setCalibration(data.partA?.calibration || { ...defaultCalibration });
    setScanParameters(data.partA?.scanParameters || { ...defaultScanParameters });
    setAcceptanceCriteria(data.partA?.acceptanceCriteria || { ...defaultAcceptanceCriteria });
    setDocumentation(data.partA?.documentation || defaultDocumentation());
    setScanDetails(data.partA?.scanDetails || { scanDetails: [] });

    setInspectionSetupB(data.partB?.inspectionSetup || { ...defaultInspectionSetup });
    setEquipmentB(data.partB?.equipment || { ...defaultEquipment });
    setCalibrationB(data.partB?.calibration || { ...defaultCalibration });
    setScanParametersB(data.partB?.scanParameters || { ...defaultScanParameters });
    setAcceptanceCriteriaB(data.partB?.acceptanceCriteria || { ...defaultAcceptanceCriteria });
    setDocumentationB(data.partB?.documentation || defaultDocumentation());
    setScanDetailsB(data.partB?.scanDetails || { scanDetails: [] });

    setInspectionReport(data.inspectionReport || getDefaultInspectionReportData());
  }, [setStandard, setActiveTab, setReportMode, setIsSplitMode, setActivePart]);

  // ג”€ג”€ Apply loaded local card (from localStorage) ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
  const applyLocalCard = useCallback((data: any) => {
    if (data.standard) setStandard(data.standard as StandardType);
    if (data.activeTab) setActiveTab(data.activeTab);
    if (data.reportMode) setReportMode(data.reportMode);
    setIsSplitMode(Boolean(data.isSplitMode));
    if (data.activePart) setActivePart(data.activePart);

    if (data.partA?.inspectionSetup) setInspectionSetup(data.partA.inspectionSetup);
    if (data.partA?.equipment) setEquipment(data.partA.equipment);
    if (data.partA?.calibration) setCalibration(data.partA.calibration);
    if (data.partA?.scanParameters) setScanParameters(data.partA.scanParameters);
    if (data.partA?.acceptanceCriteria) setAcceptanceCriteria(data.partA.acceptanceCriteria);
    if (data.partA?.documentation) setDocumentation(data.partA.documentation);
    if (data.partA?.scanDetails) setScanDetails(data.partA.scanDetails);

    if (data.partB?.inspectionSetup) setInspectionSetupB(data.partB.inspectionSetup);
    if (data.partB?.equipment) setEquipmentB(data.partB.equipment);
    if (data.partB?.calibration) setCalibrationB(data.partB.calibration);
    if (data.partB?.scanParameters) setScanParametersB(data.partB.scanParameters);
    if (data.partB?.acceptanceCriteria) setAcceptanceCriteriaB(data.partB.acceptanceCriteria);
    if (data.partB?.documentation) setDocumentationB(data.partB.documentation);
    if (data.partB?.scanDetails) setScanDetailsB(data.partB.scanDetails);

    if (data.inspectionReport) setInspectionReport(data.inspectionReport);
  }, [setStandard, setActiveTab, setReportMode, setIsSplitMode, setActivePart]);

  // ג”€ג”€ Load / save draft from localStorage ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
  const loadDraftFromLocalStorage = useCallback(() => {
    const saved = localStorage.getItem("techniqueSheet_draft");
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      setStandard(data.standard || "AMS-STD-2154E");
      setIsSplitMode(data.isSplitMode || false);
      setActivePart(data.activePart || "A");
      if (data.inspectionSetup) setInspectionSetup(data.inspectionSetup);
      if (data.equipment) setEquipment(data.equipment);
      if (data.calibration) setCalibration(data.calibration);
      if (data.scanParameters) setScanParameters(data.scanParameters);
      if (data.acceptanceCriteria) setAcceptanceCriteria(data.acceptanceCriteria);
      if (data.documentation) setDocumentation(data.documentation);
      if (data.scanDetails) setScanDetails(data.scanDetails);
      if (data.inspectionSetupB) setInspectionSetupB(data.inspectionSetupB);
      if (data.equipmentB) setEquipmentB(data.equipmentB);
      if (data.calibrationB) setCalibrationB(data.calibrationB);
      if (data.scanParametersB) setScanParametersB(data.scanParametersB);
      if (data.acceptanceCriteriaB) setAcceptanceCriteriaB(data.acceptanceCriteriaB);
      if (data.documentationB) setDocumentationB(data.documentationB);
      if (data.scanDetailsB) setScanDetailsB(data.scanDetailsB);
    } catch (error) {
      logError("Failed to load draft data", error);
    }
  }, [setStandard, setIsSplitMode, setActivePart]);

  // ג”€ג”€ Load test card (dev / testing) ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
  const applyTestCard = useCallback((card: {
    standard: StandardType;
    inspectionSetup: InspectionSetupData;
    equipment: EquipmentData;
    calibration: CalibrationData;
    scanParameters: ScanParametersData;
    acceptanceCriteria: AcceptanceCriteriaData;
    documentation: DocumentationData;
    scanDetails: ScanDetailsData;
  }) => {
    setStandard(card.standard);
    setInspectionSetup(card.inspectionSetup);
    setEquipment(card.equipment);
    setCalibration(card.calibration);
    setScanParameters(card.scanParameters);
    setAcceptanceCriteria(card.acceptanceCriteria);
    setDocumentation(card.documentation);
    setScanDetails(card.scanDetails);
  }, [setStandard]);

  // ג”€ג”€ Apply sample card (from JSON) ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€ג”€
  const applySampleCard = useCallback((card: any) => {
    setStandard(card.standard || "AMS-STD-2154E");
    if (card.inspectionSetup) setInspectionSetup(card.inspectionSetup);
    if (card.equipment) setEquipment(card.equipment);
    if (card.calibration) setCalibration(card.calibration);
    if (card.scanParameters) setScanParameters(card.scanParameters);
    if (card.acceptanceCriteria) setAcceptanceCriteria(card.acceptanceCriteria);
    if (card.documentation) setDocumentation(card.documentation);
  }, [setStandard]);
  /**
   * Apply a user-initiated standard change.
   *
   * When switching standards, update all standard-dependent fields immediately
   * (even if a tab isn\'t mounted), so no stale values remain from the previous
   * standard.
   */
  const applyStandardChange = useCallback((nextStandard: StandardType) => {
    // 1) Update UI-level standard state
    setStandard(nextStandard);

    const getValidClassForStandard = (std: StandardType, currentClass: string | undefined) => {
      const classes = acceptanceClassesByStandard[std] || acceptanceClassesByStandard["AMS-STD-2154E"];
      const isValid = typeof currentClass === "string" && classes.some((c) => c.id === currentClass);
      return isValid ? currentClass : getDefaultAcceptanceClass(std);
    };

      const applyAcceptance = (prev: AcceptanceCriteriaData): AcceptanceCriteriaData => {
        const nextClass = getValidClassForStandard(nextStandard, prev.acceptanceClass as any);
        const criteria = (acceptanceCriteriaByStandard as any)[nextStandard]?.[nextClass];

        if (!criteria) {
          return { ...prev, acceptanceClass: nextClass as any };
        }

        const bwlParsed = Number.parseFloat(criteria.backReflectionLoss);

        return {
          ...prev,
          acceptanceClass: nextClass as any,
          singleDiscontinuity: criteria.singleDiscontinuity ?? "",
          multipleDiscontinuities: criteria.multipleDiscontinuities ?? "",
          linearDiscontinuity: criteria.linearDiscontinuity ?? "",
          // Some standards express this as text (e.g., NDIP post-cal verification tolerance).
          // Only override the numeric field when the standard value parses as a finite number.
          backReflectionLoss: Number.isFinite(bwlParsed) ? bwlParsed : prev.backReflectionLoss,
          noiseLevel: criteria.noiseLevel ?? "",
          specialRequirements: prev.specialRequirements || criteria.specialNotes || "",
        };
      };

    const applyScanParameters = (prev: ScanParametersData): ScanParametersData => {
      const rules = scanParametersByStandard[nextStandard];
      if (!rules) return prev;

      const minOverlap = Number.isFinite(rules.minOverlap) ? rules.minOverlap : 0;
      const maxIndex = Math.max(0, Math.min(100, 100 - minOverlap));

      let scanIndex = Number.isFinite(prev.scanIndex) ? prev.scanIndex : 70;
      if (minOverlap > 0 && 100 - scanIndex < minOverlap) {
        scanIndex = maxIndex;
      }

      let scanType = (prev.scanType || "").trim();
      if (!scanType) scanType = "manual";

      // PW NDIP is automated-only (manual max speed is 0 in our rules table)
      const manualMax = rules.maxSpeedManual?.value ?? 0;
      const autoMax = rules.maxSpeedAutomated?.value ?? 0;
      if (manualMax === 0 && autoMax > 0 && scanType !== "fully_automated") {
        scanType = "fully_automated";
      }

      const maxSpeed = scanType === "fully_automated" ? autoMax : manualMax;
      let scanSpeed = Number.isFinite(prev.scanSpeed) ? prev.scanSpeed : 100;
      if (maxSpeed > 0) scanSpeed = Math.min(scanSpeed, maxSpeed);

      const isPwNdip = nextStandard === "NDIP-1226" || nextStandard === "NDIP-1227";
      const waterPathMm = isPwNdip ? 8.0 * 25.4 : prev.waterPath;

      const scanMethods = isPwNdip ? ["immersion"] : (prev.scanMethods || []);
      const scanMethod = isPwNdip ? "immersion" : prev.scanMethod;

      return {
        ...prev,
        scanType,
        scanSpeed,
        scanIndex,
        coverage: rules.coverageRequired,
        scanMethods,
        scanMethod,
        waterPath: waterPathMm,
        technique: isPwNdip ? "conventional" : prev.technique,
      };
    };

    const applyEquipment = (prev: EquipmentData): EquipmentData => {
      const isPwNdip = nextStandard === "NDIP-1226" || nextStandard === "NDIP-1227";
      if (!isPwNdip) return prev;

      return {
        ...prev,
        frequency: "5.0",
        transducerType: prev.transducerType || "immersion",
        couplant: prev.couplant || "Water (Immersion)",
      };
    };

    const applyCalibration = (prev: CalibrationData, thicknessMm: number, acceptanceClass: string): CalibrationData => {
      const isPwNdip = nextStandard === "NDIP-1226" || nextStandard === "NDIP-1227";
      const calReq = calibrationByStandard[nextStandard];

      if (isPwNdip) {
        const inchToMm = (inch: number) => Number((inch * 25.4).toFixed(3));
        const holeDiameterMm = Number((PW_ANGLE_CALIBRATION_BLOCK.holes[0].diameter * 25.4).toFixed(2));
        const activeHoles = PW_ANGLE_CALIBRATION_BLOCK.holes.filter((h) => h.used);

        const fbhHoles = activeHoles.map((h, idx) => {
          const depthMm = inchToMm(h.depth);
          return {
            id: idx + 1,
            partNumber: PW_ANGLE_CALIBRATION_BLOCK.partNumber,
            deltaType: "dac",
            diameterInch: "1/64",
            diameterMm: holeDiameterMm,
            blockHeightE: depthMm,
            metalTravelH: depthMm,
          };
        });

        const fbhSizes = fbhHoles.map((h) => h.diameterInch).join(", ");
        const avgMetalTravel = fbhHoles.length > 0
          ? fbhHoles.reduce((sum, h) => sum + h.metalTravelH, 0) / fbhHoles.length
          : prev.metalTravelDistance;

        const dims = PW_ANGLE_CALIBRATION_BLOCK.dimensions;
        const dimStr = [
          dims.length ? `L=${dims.length.toFixed(3)}in` : null,
          dims.width ? `W=${dims.width.toFixed(3)}in` : null,
          dims.height ? `H=${dims.height.toFixed(3)}in` : null,
        ].filter(Boolean).join(", ");

        return {
          ...prev,
          standardType: "angle_beam",
          referenceMaterial: PW_ANGLE_CALIBRATION_BLOCK.material,
          fbhSizes,
          fbhHoles,
          metalTravelDistance: avgMetalTravel,
          blockDimensions: dimStr || prev.blockDimensions,
          autoRecommendedReason:
            `PW ${nextStandard} calibration: ${PW_ANGLE_CALIBRATION_BLOCK.partNumber} ` +
            `(holes L-S, J & K omitted). Post-calibration tolerance ±1 dB.`,
        };
      }

      const safeThickness = Number.isFinite(thicknessMm) && thicknessMm > 0 ? thicknessMm : 25;
      const recommendedFbh = getFBHSizeForStandard(nextStandard, safeThickness, acceptanceClass || "A");

      return {
        ...prev,
        referenceMaterial: calReq?.referenceBlockMaterial || prev.referenceMaterial,
        fbhSizes: recommendedFbh || prev.fbhSizes,
      };
    };

    // Apply standard-dependent updates to BOTH parts (keeps split mode consistent)
    setAcceptanceCriteria(applyAcceptance);
    setAcceptanceCriteriaB(applyAcceptance);

    setScanParameters(applyScanParameters);
    setScanParametersB(applyScanParameters);

    setEquipment(applyEquipment);
    setEquipmentB(applyEquipment);

    // Calibration uses thickness + acceptance class; derive from each part\'s current setup.
    setCalibration((prev) => {
      const t = inspectionSetup.wallThickness || inspectionSetup.partThickness || 25;
      const nextClass = getValidClassForStandard(nextStandard, acceptanceCriteria.acceptanceClass as any);
      return applyCalibration(prev, t, nextClass);
    });
    setCalibrationB((prev) => {
      const t = inspectionSetupB.wallThickness || inspectionSetupB.partThickness || 25;
      const nextClass = getValidClassForStandard(nextStandard, acceptanceCriteriaB.acceptanceClass as any);
      return applyCalibration(prev, t, nextClass);
    });
  }, [
    setStandard,
    setAcceptanceCriteria,
    setAcceptanceCriteriaB,
    setScanParameters,
    setScanParametersB,
    setEquipment,
    setEquipmentB,
    setCalibration,
    setCalibrationB,
    inspectionSetup,
    inspectionSetupB,
    acceptanceCriteria.acceptanceClass,
    acceptanceCriteriaB.acceptanceClass,
  ]);

  return {
    // Part A
    inspectionSetup, setInspectionSetup,
    equipment, setEquipment,
    calibration, setCalibration,
    scanParameters, setScanParameters,
    acceptanceCriteria, setAcceptanceCriteria,
    documentation, setDocumentation,
    scanDetails, setScanDetails,
    scanPlan, setScanPlan,
    // Part B
    inspectionSetupB, setInspectionSetupB,
    equipmentB, setEquipmentB,
    calibrationB, setCalibrationB,
    scanParametersB, setScanParametersB,
    acceptanceCriteriaB, setAcceptanceCriteriaB,
    documentationB, setDocumentationB,
    scanDetailsB, setScanDetailsB,
    scanPlanB, setScanPlanB,
    // Inspection Report
    inspectionReport, setInspectionReport,
    // Derived / helpers
    currentData,
    copyPartAToB,
    buildTechniqueSheetPayload,
    buildCardData,
    applyLoadedSheet,
    applyLocalCard,
    loadDraftFromLocalStorage,
    applyTestCard,    applySampleCard,
    applyStandardChange,
  };
}
