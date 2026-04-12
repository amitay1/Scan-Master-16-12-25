import { useState, useMemo, useCallback, useRef, Dispatch, SetStateAction } from "react";
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
  equipmentParametersByStandard,
  getDefaultAcceptanceClass,
  getFBHSizeForStandard,
  scanParametersByStandard,
} from "@/data/standardsDifferences";
import { PW_ANGLE_CALIBRATION_BLOCK } from "@/rules/pw/pwCalibrationBlocks";
import { PW_45_DEGREE_MIRROR, PW_PRIMARY_TRANSDUCER } from "@/rules/pw/pwTransducers";
import { getInspectionThickness } from "@/utils/inspectionThickness";
import { normalizeInspectionSetupForStandard } from "@/utils/inspectionSetupProfiles";
import { normalizeScanDetailsForStandard } from "@/utils/pwScanDetailDefaults";
import {
  getV2500InspectionSetupDefaults,
  isV2500NdipStandard,
  V2500_CALIBRATION_BLOCK_HOLDER,
  V2500_CHUCK_RISER_DEFAULTS,
  V2500_MARKING_PENCIL,
} from "@/utils/pwNdipDefaults";
import { readTechniqueSheetDraft } from "@/utils/updateRecovery";

const defaultInspectionSetup: InspectionSetupData = {
  partNumber: "",
  partName: "",
  material: "",
  materialSpec: "",
  partType: "",
  localModelAssetName: undefined,
  partThickness: 0,
  partLength: 0,
  partWidth: 0,
  diameter: 0,
  hptDiskGeometry: undefined,
};

const defaultEquipment: EquipmentData = {
  manufacturer: "",
  model: "",
  serialNumber: "",
  frequency: "5.0",
  transducerType: "",
  transducerTypes: [],
  transducerShapeAndSize: "",
  transducerDiameter: 0,
  couplant: "",
  customCouplant: "",
  includeSelectionNotesInReport: false,
  selectionNotes: "",
  verticalLinearity: 0,
  horizontalLinearity: 0,
  entrySurfaceResolution: 0,
  backSurfaceResolution: 0,
  ndipMarkingPencil: "",
};

const defaultCalibration: CalibrationData = {
  standardType: "",
  referenceMaterial: "",
  fbhSizes: "",
  metalTravelDistance: 0,
  blockDimensions: "",
  blockDimensionsMode: "flat",
  blockSerialNumber: "",
  blockHolder: "",
  lastCalibrationDate: "",
};

const defaultScanParameters: ScanParametersData = {
  scanMethod: "",
  scanMethods: [],
  technique: "conventional",
  scanType: "",
  scanSpeed: 0,
  scanIndex: 0,
  coverage: 0,
  scanPattern: "",
  waterPath: 0,
  pulseRepetitionRate: 0,
  gainSettings: "",
  alarmGateSettings: "",
};

const defaultAcceptanceCriteria: AcceptanceCriteriaData = {
  acceptanceClass: "",
  singleDiscontinuity: "",
  multipleDiscontinuities: "",
  linearDiscontinuity: "",
  backReflectionLoss: 0,
  noiseLevel: "",
  specialRequirements: "",
  standardNotes: "",
  includeStandardNotesInReport: false,
};

const defaultDocumentation = (): DocumentationData => ({
  inspectorName: "",
  inspectorCertification: "",
  inspectorLevel: "",
  certifyingOrganization: "",
  inspectionDate: "",
  procedureNumber: "",
  drawingReference: "",
  revision: "",
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

interface TechniqueSheetPartState {
  inspectionSetup: InspectionSetupData;
  equipment: EquipmentData;
  calibration: CalibrationData;
  scanParameters: ScanParametersData;
  acceptanceCriteria: AcceptanceCriteriaData;
  documentation: DocumentationData;
  scanDetails: ScanDetailsData;
  scanPlan: ScanPlanData;
}

interface StandardScopedTechniqueState {
  partA: TechniqueSheetPartState;
  partB: TechniqueSheetPartState;
  inspectionReport: InspectionReportData;
}

const cloneTechniqueValue = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const createDefaultPartState = (): TechniqueSheetPartState => ({
  inspectionSetup: cloneTechniqueValue(defaultInspectionSetup),
  equipment: cloneTechniqueValue(defaultEquipment),
  calibration: cloneTechniqueValue(defaultCalibration),
  scanParameters: cloneTechniqueValue(defaultScanParameters),
  acceptanceCriteria: cloneTechniqueValue(defaultAcceptanceCriteria),
  documentation: defaultDocumentation(),
  scanDetails: cloneTechniqueValue(defaultScanDetails),
  scanPlan: cloneTechniqueValue(defaultScanPlan),
});

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
  const standardStateCacheRef = useRef<Partial<Record<StandardType, StandardScopedTechniqueState>>>({});
  const [hasHydratedInitialDraft, setHasHydratedInitialDraft] = useState(false);
  const [inspectionSetup, setInspectionSetup] = useState<InspectionSetupData>({ ...defaultInspectionSetup });
  const [equipment, setEquipment] = useState<EquipmentData>({ ...defaultEquipment });
  const [calibration, setCalibration] = useState<CalibrationData>({ ...defaultCalibration });
  const [scanParameters, setScanParameters] = useState<ScanParametersData>({ ...defaultScanParameters });
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<AcceptanceCriteriaData>({ ...defaultAcceptanceCriteria });
  const [documentation, setDocumentation] = useState<DocumentationData>(defaultDocumentation());
  const [scanDetails, setScanDetails] = useState<ScanDetailsData>({ ...defaultScanDetails });
  const [scanPlan, setScanPlan] = useState<ScanPlanData>(JSON.parse(JSON.stringify(defaultScanPlan)));
  const [inspectionSetupB, setInspectionSetupB] = useState<InspectionSetupData>({ ...defaultInspectionSetup });
  const [equipmentB, setEquipmentB] = useState<EquipmentData>({ ...defaultEquipment });
  const [calibrationB, setCalibrationB] = useState<CalibrationData>({ ...defaultCalibration });
  const [scanParametersB, setScanParametersB] = useState<ScanParametersData>({ ...defaultScanParameters });
  const [acceptanceCriteriaB, setAcceptanceCriteriaB] = useState<AcceptanceCriteriaData>({ ...defaultAcceptanceCriteria });
  const [documentationB, setDocumentationB] = useState<DocumentationData>(defaultDocumentation());
  const [scanDetailsB, setScanDetailsB] = useState<ScanDetailsData>({ ...defaultScanDetails });
  const [scanPlanB, setScanPlanB] = useState<ScanPlanData>(JSON.parse(JSON.stringify(defaultScanPlan)));
  const [inspectionReport, setInspectionReport] = useState<InspectionReportData>(getDefaultInspectionReportData());
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
  const copyPartAToB = useCallback(() => {
    setInspectionSetupB({ ...inspectionSetup });
    setEquipmentB({ ...equipment });
    setCalibrationB({ ...calibration });
    setScanParametersB({ ...scanParameters });
    setAcceptanceCriteriaB({ ...acceptanceCriteria });
    setDocumentationB({ ...documentation });
    setScanDetailsB({ ...scanDetails });
    setScanPlanB(JSON.parse(JSON.stringify(scanPlan)));
    toast.success("Part A copied to Part B");
  }, [inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria, documentation, scanDetails, scanPlan]);
  const buildTechniqueSheetPayload = useCallback((): TechniqueSheetCardData => ({
    standard,
    activeTab,
    reportMode,
    isSplitMode,
    activePart,
    partA: {
      inspectionSetup, equipment, calibration, scanParameters,
      acceptanceCriteria, documentation, scanDetails, scanPlan,
    },
    partB: {
      inspectionSetup: inspectionSetupB, equipment: equipmentB,
      calibration: calibrationB, scanParameters: scanParametersB,
      acceptanceCriteria: acceptanceCriteriaB, documentation: documentationB,
      scanDetails: scanDetailsB,
      scanPlan: scanPlanB,
    },
    inspectionReport,
  }), [
    standard, activeTab, reportMode, isSplitMode, activePart,
    inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria, documentation, scanDetails, scanPlan,
    inspectionSetupB, equipmentB, calibrationB, scanParametersB, acceptanceCriteriaB, documentationB, scanDetailsB, scanPlanB,
    inspectionReport,
  ]);
  const buildCardData = useCallback(() => ({
    standard,
    activeTab,
    reportMode,
    isSplitMode,
    activePart,
    partA: {
      inspectionSetup, equipment, calibration, scanParameters,
      acceptanceCriteria, documentation, scanDetails, scanPlan,
    },
    partB: isSplitMode ? {
      inspectionSetup: inspectionSetupB, equipment: equipmentB,
      calibration: calibrationB, scanParameters: scanParametersB,
      acceptanceCriteria: acceptanceCriteriaB, documentation: documentationB,
      scanDetails: scanDetailsB,
      scanPlan: scanPlanB,
    } : undefined,
    inspectionReport: reportMode === "Report" ? inspectionReport : undefined,
  }), [
    standard, activeTab, reportMode, isSplitMode, activePart,
    inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria, documentation, scanDetails, scanPlan,
    inspectionSetupB, equipmentB, calibrationB, scanParametersB, acceptanceCriteriaB, documentationB, scanDetailsB, scanPlanB,
    inspectionReport,
  ]);
  const applyLoadedSheet = useCallback((record: TechniqueSheetRecord) => {
    standardStateCacheRef.current = {};
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
    setScanPlan(data.partA?.scanPlan || JSON.parse(JSON.stringify(defaultScanPlan)));

    setInspectionSetupB(data.partB?.inspectionSetup || { ...defaultInspectionSetup });
    setEquipmentB(data.partB?.equipment || { ...defaultEquipment });
    setCalibrationB(data.partB?.calibration || { ...defaultCalibration });
    setScanParametersB(data.partB?.scanParameters || { ...defaultScanParameters });
    setAcceptanceCriteriaB(data.partB?.acceptanceCriteria || { ...defaultAcceptanceCriteria });
    setDocumentationB(data.partB?.documentation || defaultDocumentation());
    setScanDetailsB(data.partB?.scanDetails || { scanDetails: [] });
    setScanPlanB(data.partB?.scanPlan || JSON.parse(JSON.stringify(defaultScanPlan)));

    setInspectionReport(data.inspectionReport || getDefaultInspectionReportData());
  }, [setStandard, setActiveTab, setReportMode, setIsSplitMode, setActivePart]);
  const applyLocalCard = useCallback((data: any) => {
    standardStateCacheRef.current = {};
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
    if (data.partA?.scanPlan) setScanPlan(data.partA.scanPlan);

    if (data.partB?.inspectionSetup) setInspectionSetupB(data.partB.inspectionSetup);
    if (data.partB?.equipment) setEquipmentB(data.partB.equipment);
    if (data.partB?.calibration) setCalibrationB(data.partB.calibration);
    if (data.partB?.scanParameters) setScanParametersB(data.partB.scanParameters);
    if (data.partB?.acceptanceCriteria) setAcceptanceCriteriaB(data.partB.acceptanceCriteria);
    if (data.partB?.documentation) setDocumentationB(data.partB.documentation);
    if (data.partB?.scanDetails) setScanDetailsB(data.partB.scanDetails);
    if (data.partB?.scanPlan) setScanPlanB(data.partB.scanPlan);

    if (data.inspectionReport) setInspectionReport(data.inspectionReport);
  }, [setStandard, setActiveTab, setReportMode, setIsSplitMode, setActivePart]);
  const loadDraftFromLocalStorage = useCallback(() => {
    standardStateCacheRef.current = {};
    const data = readTechniqueSheetDraft<any>();
    if (!data) {
      setHasHydratedInitialDraft(true);
      return;
    }

    try {
      if (data.partA) {
        applyLocalCard(data);
        return;
      }

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
      if (data.scanPlan) setScanPlan(data.scanPlan);
      if (data.inspectionSetupB) setInspectionSetupB(data.inspectionSetupB);
      if (data.equipmentB) setEquipmentB(data.equipmentB);
      if (data.calibrationB) setCalibrationB(data.calibrationB);
      if (data.scanParametersB) setScanParametersB(data.scanParametersB);
      if (data.acceptanceCriteriaB) setAcceptanceCriteriaB(data.acceptanceCriteriaB);
      if (data.documentationB) setDocumentationB(data.documentationB);
      if (data.scanDetailsB) setScanDetailsB(data.scanDetailsB);
      if (data.scanPlanB) setScanPlanB(data.scanPlanB);
    } catch (error) {
      logError("Failed to load draft data", error);
    } finally {
      setHasHydratedInitialDraft(true);
    }
  }, [applyLocalCard, setStandard, setIsSplitMode, setActivePart]);
  const applyTestCard = useCallback((card: {
    standard: StandardType;
    inspectionSetup: InspectionSetupData;
    equipment: EquipmentData;
    calibration: CalibrationData;
    scanParameters: ScanParametersData;
    acceptanceCriteria: AcceptanceCriteriaData;
    documentation: DocumentationData;
    scanDetails: ScanDetailsData;
    scanPlan?: ScanPlanData;
    inspectionReport?: InspectionReportData;
  }) => {
    const cloneData = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
    standardStateCacheRef.current = {};

    setStandard(card.standard);
    setIsSplitMode(false);
    setActivePart("A");
    setActiveTab(reportMode === "Report" ? "cover" : "setup");

    setInspectionSetup(cloneData(card.inspectionSetup));
    setEquipment(cloneData(card.equipment));
    setCalibration(cloneData(card.calibration));
    setScanParameters(cloneData(card.scanParameters));
    setAcceptanceCriteria(cloneData(card.acceptanceCriteria));
    setDocumentation(cloneData(card.documentation));
    setScanDetails(cloneData(card.scanDetails));
    setScanPlan(cloneData(card.scanPlan || defaultScanPlan));
    setInspectionReport(cloneData(card.inspectionReport || getDefaultInspectionReportData()));

    setInspectionSetupB({ ...defaultInspectionSetup });
    setEquipmentB({ ...defaultEquipment });
    setCalibrationB({ ...defaultCalibration });
    setScanParametersB({ ...defaultScanParameters });
    setAcceptanceCriteriaB({ ...defaultAcceptanceCriteria });
    setDocumentationB(defaultDocumentation());
    setScanDetailsB({ ...defaultScanDetails });
    setScanPlanB(cloneData(defaultScanPlan));
  }, [reportMode, setStandard, setIsSplitMode, setActivePart, setActiveTab]);
  const applySampleCard = useCallback((card: any) => {
    standardStateCacheRef.current = {};
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
   * A standard switch must not leak user-entered values into another standard.
   * Each standard keeps its own snapshot, and a first visit starts clean.
   */
  const applyStandardChange = useCallback((nextStandard: StandardType) => {
    if (nextStandard === standard) {
      return;
    }

    const buildCurrentStandardSnapshot = (): StandardScopedTechniqueState => ({
      partA: {
        inspectionSetup: cloneTechniqueValue(inspectionSetup),
        equipment: cloneTechniqueValue(equipment),
        calibration: cloneTechniqueValue(calibration),
        scanParameters: cloneTechniqueValue(scanParameters),
        acceptanceCriteria: cloneTechniqueValue(acceptanceCriteria),
        documentation: cloneTechniqueValue(documentation),
        scanDetails: cloneTechniqueValue(scanDetails),
        scanPlan: cloneTechniqueValue(scanPlan),
      },
      partB: {
        inspectionSetup: cloneTechniqueValue(inspectionSetupB),
        equipment: cloneTechniqueValue(equipmentB),
        calibration: cloneTechniqueValue(calibrationB),
        scanParameters: cloneTechniqueValue(scanParametersB),
        acceptanceCriteria: cloneTechniqueValue(acceptanceCriteriaB),
        documentation: cloneTechniqueValue(documentationB),
        scanDetails: cloneTechniqueValue(scanDetailsB),
        scanPlan: cloneTechniqueValue(scanPlanB),
      },
      inspectionReport: cloneTechniqueValue(inspectionReport),
    });

    const applySnapshot = (snapshot: StandardScopedTechniqueState) => {
      setInspectionSetup(cloneTechniqueValue(snapshot.partA.inspectionSetup));
      setEquipment(cloneTechniqueValue(snapshot.partA.equipment));
      setCalibration(cloneTechniqueValue(snapshot.partA.calibration));
      setScanParameters(cloneTechniqueValue(snapshot.partA.scanParameters));
      setAcceptanceCriteria(cloneTechniqueValue(snapshot.partA.acceptanceCriteria));
      setDocumentation(cloneTechniqueValue(snapshot.partA.documentation));
      setScanDetails(cloneTechniqueValue(snapshot.partA.scanDetails));
      setScanPlan(cloneTechniqueValue(snapshot.partA.scanPlan));

      setInspectionSetupB(cloneTechniqueValue(snapshot.partB.inspectionSetup));
      setEquipmentB(cloneTechniqueValue(snapshot.partB.equipment));
      setCalibrationB(cloneTechniqueValue(snapshot.partB.calibration));
      setScanParametersB(cloneTechniqueValue(snapshot.partB.scanParameters));
      setAcceptanceCriteriaB(cloneTechniqueValue(snapshot.partB.acceptanceCriteria));
      setDocumentationB(cloneTechniqueValue(snapshot.partB.documentation));
      setScanDetailsB(cloneTechniqueValue(snapshot.partB.scanDetails));
      setScanPlanB(cloneTechniqueValue(snapshot.partB.scanPlan));

      setInspectionReport(cloneTechniqueValue(snapshot.inspectionReport));
    };

    const buildFreshStandardSnapshot = (targetStandard: StandardType): StandardScopedTechniqueState => {
      const createFreshPartState = (): TechniqueSheetPartState => {
        const partState = createDefaultPartState();
        partState.inspectionSetup = normalizeInspectionSetupForStandard(
          cloneTechniqueValue(partState.inspectionSetup),
          targetStandard,
        );
        partState.scanDetails = {
          scanDetails: normalizeScanDetailsForStandard([], targetStandard) ?? [],
        };
        return partState;
      };

      return {
        partA: createFreshPartState(),
        partB: createFreshPartState(),
        inspectionReport: cloneTechniqueValue(getDefaultInspectionReportData()),
      };
    };

    standardStateCacheRef.current[standard] = buildCurrentStandardSnapshot();

    if (!isV2500NdipStandard(nextStandard) && activeTab === "ndip-reference") {
      setActiveTab("setup");
    }

    const cachedSnapshot = standardStateCacheRef.current[nextStandard];
    const nextSnapshot = cachedSnapshot
      ? cloneTechniqueValue(cachedSnapshot)
      : buildFreshStandardSnapshot(nextStandard);

    setStandard(nextStandard);
    applySnapshot(nextSnapshot);
    return;
    // 1) Update UI-level standard state
    setStandard(nextStandard);
    const isPwNdip = isV2500NdipStandard(nextStandard);
    const previousPwDefaults = getV2500InspectionSetupDefaults(standard);

    if (!isPwNdip && activeTab === "ndip-reference") {
      setActiveTab("setup");
    }

    const applyInspectionSetup = (prev: InspectionSetupData): InspectionSetupData => {
      let baseSetup = { ...prev };

      if (!isPwNdip && previousPwDefaults) {
        if (baseSetup.partName === previousPwDefaults.partName) {
          baseSetup.partName = "";
        }
        if (baseSetup.partNumber === previousPwDefaults.partNumber) {
          baseSetup.partNumber = "";
        }
      }

      const pwDefaults = getV2500InspectionSetupDefaults(nextStandard);
      const mergedSetup = pwDefaults ? {
        ...baseSetup,
        ...pwDefaults,
      } : baseSetup;

      return normalizeInspectionSetupForStandard(mergedSetup, nextStandard);
    };

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
      if (isPwNdip) {
        // NDIP V2500 procedures are automated immersion workflows.
        scanType = "fully_automated";
      }

      // PW NDIP is automated-only (manual max speed is 0 in our rules table)
      const manualMax = rules.maxSpeedManual?.value ?? 0;
      const autoMax = rules.maxSpeedAutomated?.value ?? 0;
      if (manualMax === 0 && autoMax > 0 && scanType !== "fully_automated") {
        scanType = "fully_automated";
      }

      const maxSpeed = scanType === "fully_automated" ? autoMax : manualMax;
      let scanSpeed = Number.isFinite(prev.scanSpeed) ? prev.scanSpeed : 100;
      if (maxSpeed > 0) scanSpeed = Math.min(scanSpeed, maxSpeed);

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
      const eqRules = equipmentParametersByStandard[nextStandard];
      const typicalFrequency = eqRules?.frequencyRange?.typical;
      const normalizedFrequency = Number.isFinite(typicalFrequency)
        ? (Number.isInteger(typicalFrequency) ? typicalFrequency.toFixed(1) : String(typicalFrequency))
        : prev.frequency;

      const ndipEquipmentByManufacturer: Record<string, string> = {
        "Inspection Research & Technologies Ltd": "LS-200 Immersion Tank and Ultrasonic Scanner",
        Matec: "IMT3007-SS-TT-L-ARN or equivalent",
      };
      const ndipManufacturers = Object.keys(ndipEquipmentByManufacturer);
      const manufacturer = isPwNdip
        ? (ndipManufacturers.includes(prev.manufacturer) ? prev.manufacturer : ndipManufacturers[0])
        : prev.manufacturer;

      return {
        ...prev,
        frequency: normalizedFrequency,
        manufacturer,
        model: isPwNdip ? ndipEquipmentByManufacturer[manufacturer] : prev.model,
        probeModel: isPwNdip ? PW_PRIMARY_TRANSDUCER.partNumber : prev.probeModel,
        transducerType: isPwNdip ? "immersion" : prev.transducerType,
        transducerTypes: isPwNdip ? ["immersion"] : prev.transducerTypes,
        transducerShapeAndSize: isPwNdip ? "" : prev.transducerShapeAndSize,
        couplant: isPwNdip ? "Water (Immersion)" : prev.couplant,
        bandwidth: isPwNdip ? PW_PRIMARY_TRANSDUCER.bandwidth : prev.bandwidth,
        focusSize: isPwNdip ? `${PW_PRIMARY_TRANSDUCER.focalLength}''` : prev.focusSize,
        velocity: isPwNdip ? 5920 / 2 : prev.velocity,
        wedgeModel: isPwNdip ? PW_45_DEGREE_MIRROR.partNumber : prev.wedgeModel,
        ndipMarkingPencil: isPwNdip ? (prev.ndipMarkingPencil || V2500_MARKING_PENCIL) : prev.ndipMarkingPencil,
        ndipChuckRiser: isPwNdip ? (prev.ndipChuckRiser || V2500_CHUCK_RISER_DEFAULTS[nextStandard]) : prev.ndipChuckRiser,
      };
    };

    const applyCalibration = (prev: CalibrationData, thicknessMm: number, acceptanceClass: string): CalibrationData => {
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
          blockHolder: prev.blockHolder || V2500_CALIBRATION_BLOCK_HOLDER,
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

    const applyScanDetails = (prev: ScanDetailsData): ScanDetailsData => {
      const normalized = normalizeScanDetailsForStandard(prev.scanDetails, nextStandard);
      const scanDetails = normalized ?? prev.scanDetails ?? [];

      return {
        ...prev,
        scanDetails: scanDetails.map((detail) => {
          const isShearWave = /shear wave/i.test(detail.waveMode || "");
          return {
            ...detail,
            velocity: isShearWave ? 5920 / 2 : detail.velocity,
            incidentAngle: isPwNdip
              ? ([18, 19, 20, 21].includes(Number(detail.incidentAngle)) ? detail.incidentAngle : 18)
              : detail.incidentAngle,
          };
        }),
      };
    };

    // Apply standard-dependent updates to BOTH parts (keeps split mode consistent)
    setInspectionSetup(applyInspectionSetup);
    setInspectionSetupB(applyInspectionSetup);

    setAcceptanceCriteria(applyAcceptance);
    setAcceptanceCriteriaB(applyAcceptance);

    setScanParameters(applyScanParameters);
    setScanParametersB(applyScanParameters);

    setEquipment(applyEquipment);
    setEquipmentB(applyEquipment);

    setScanDetails(applyScanDetails);
    setScanDetailsB(applyScanDetails);

    // Calibration uses thickness + acceptance class; derive from each part\'s current setup.
    setCalibration((prev) => {
      const t = getInspectionThickness(inspectionSetup, 25);
      const nextClass = getValidClassForStandard(nextStandard, acceptanceCriteria.acceptanceClass as any);
      return applyCalibration(prev, t, nextClass);
    });
    setCalibrationB((prev) => {
      const t = getInspectionThickness(inspectionSetupB, 25);
      const nextClass = getValidClassForStandard(nextStandard, acceptanceCriteriaB.acceptanceClass as any);
      return applyCalibration(prev, t, nextClass);
    });

  }, [
    activeTab,
    setActiveTab,
    setStandard,
    standard,
    inspectionSetup,
    equipment,
    calibration,
    scanParameters,
    acceptanceCriteria,
    documentation,
    scanDetails,
    scanPlan,
    inspectionSetupB,
    equipmentB,
    calibrationB,
    scanParametersB,
    acceptanceCriteriaB,
    documentationB,
    scanDetailsB,
    scanPlanB,
    inspectionReport,
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
    hasHydratedInitialDraft,
    applyTestCard,    applySampleCard,
    applyStandardChange,
  };
}
