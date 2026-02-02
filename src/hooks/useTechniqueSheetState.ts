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

// ── Default initial values ──────────────────────────────────────────────────

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

// ── Current-data shape returned by currentData useMemo ──────────────────────

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

// ── Hook params ─────────────────────────────────────────────────────────────

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
  // ── Part A state ────────────────────────────────────────────────────────
  const [inspectionSetup, setInspectionSetup] = useState<InspectionSetupData>({ ...defaultInspectionSetup });
  const [equipment, setEquipment] = useState<EquipmentData>({ ...defaultEquipment });
  const [calibration, setCalibration] = useState<CalibrationData>({ ...defaultCalibration });
  const [scanParameters, setScanParameters] = useState<ScanParametersData>({ ...defaultScanParameters });
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<AcceptanceCriteriaData>({ ...defaultAcceptanceCriteria });
  const [documentation, setDocumentation] = useState<DocumentationData>(defaultDocumentation());
  const [scanDetails, setScanDetails] = useState<ScanDetailsData>({ ...defaultScanDetails });
  const [scanPlan, setScanPlan] = useState<ScanPlanData>(JSON.parse(JSON.stringify(defaultScanPlan)));

  // ── Part B state ────────────────────────────────────────────────────────
  const [inspectionSetupB, setInspectionSetupB] = useState<InspectionSetupData>({ ...defaultInspectionSetup });
  const [equipmentB, setEquipmentB] = useState<EquipmentData>({ ...defaultEquipment });
  const [calibrationB, setCalibrationB] = useState<CalibrationData>({ ...defaultCalibration });
  const [scanParametersB, setScanParametersB] = useState<ScanParametersData>({ ...defaultScanParameters });
  const [acceptanceCriteriaB, setAcceptanceCriteriaB] = useState<AcceptanceCriteriaData>({ ...defaultAcceptanceCriteria });
  const [documentationB, setDocumentationB] = useState<DocumentationData>(defaultDocumentation());
  const [scanDetailsB, setScanDetailsB] = useState<ScanDetailsData>({ ...defaultScanDetails });
  const [scanPlanB, setScanPlanB] = useState<ScanPlanData>(JSON.parse(JSON.stringify(defaultScanPlan)));

  // ── Inspection Report state ─────────────────────────────────────────────
  const [inspectionReport, setInspectionReport] = useState<InspectionReportData>(getDefaultInspectionReportData());

  // ── currentData – picks A or B depending on split mode ─────────────────
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

  // ── Copy Part A → B ────────────────────────────────────────────────────
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

  // ── Build payload for DB save ──────────────────────────────────────────
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

  // ── Build card data for local save ─────────────────────────────────────
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

  // ── Apply loaded sheet (from DB) ───────────────────────────────────────
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

  // ── Apply loaded local card (from localStorage) ────────────────────────
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

  // ── Load / save draft from localStorage ────────────────────────────────
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

  // ── Load test card (dev / testing) ─────────────────────────────────────
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

  // ── Apply sample card (from JSON) ──────────────────────────────────────
  const applySampleCard = useCallback((card: any) => {
    setStandard(card.standard || "AMS-STD-2154E");
    if (card.inspectionSetup) setInspectionSetup(card.inspectionSetup);
    if (card.equipment) setEquipment(card.equipment);
    if (card.calibration) setCalibration(card.calibration);
    if (card.scanParameters) setScanParameters(card.scanParameters);
    if (card.acceptanceCriteria) setAcceptanceCriteria(card.acceptanceCriteria);
    if (card.documentation) setDocumentation(card.documentation);
  }, [setStandard]);

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
    applyTestCard,
    applySampleCard,
  };
}
