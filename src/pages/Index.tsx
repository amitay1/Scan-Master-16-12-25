import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StandardSelector } from "@/components/StandardSelector";
import { ThreeDViewer } from "@/components/ThreeDViewer";
import { MenuBar } from "@/components/MenuBar";
import { Toolbar } from "@/components/Toolbar";
import { StatusBar } from "@/components/StatusBar";
import { UnifiedExportDialog } from "@/components/export/UnifiedExportDialog";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InspectionSetupTab } from "@/components/tabs/InspectionSetupTab";
import { EquipmentTab } from "@/components/tabs/EquipmentTab";
import { CalibrationTab } from "@/components/tabs/CalibrationTab";
import { ScanParametersTab } from "@/components/tabs/ScanParametersTab";
import { AcceptanceCriteriaTab } from "@/components/tabs/AcceptanceCriteriaTab";
import { DocumentationTab } from "@/components/tabs/DocumentationTab";
import { CoverPageTab } from "@/components/tabs/CoverPageTab";
import { PartDiagramTab } from "@/components/tabs/PartDiagramTab";
import { ProbeDetailsTab } from "@/components/tabs/ProbeDetailsTab";
import { ScansTab } from "@/components/tabs/ScansTab";
import { RemarksTab } from "@/components/tabs/RemarksTab";
import { ScanDetailsTab } from "@/components/tabs/ScanDetailsTab";
import type { ScanDetailsData } from "@/types/scanDetails";
import { ScanPlanTab } from "@/components/tabs/ScanPlanTab";
import { ProbeProgressGauge } from "@/components/ui/ProbeProgressGauge";
import { HorizontalProgressBar } from "@/components/ui/HorizontalProgressBar";
import { WebGLLiquidProgress } from "@/components/ui/WebGLLiquidProgress";
import { Collapsible3DPanel } from "@/components/ui/ResizablePanel";
import { CollapsibleSidebar } from "@/components/CollapsibleSidebar";
import type { SavedCard } from "@/contexts/SavedCardsContext";
import { useSavedCards } from "@/hooks/useSavedCards";
import {
  StandardType,
  InspectionSetupData,
  EquipmentData,
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  DocumentationData,
  MaterialType,
  ScanPlanData
} from "@/types/techniqueSheet";
import { InspectionReportData } from "@/types/inspectionReport";
import { standardRules, getRecommendedFrequency, getCouplantRecommendation, calculateMetalTravel } from "@/utils/autoFillLogic";
import { useAuth } from "@/hooks/useAuth";
import { logError, logInfo } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { fieldDependencyEngine } from "@/utils/standards/fieldDependencyEngine";
import { validationEngine } from "@/utils/standards/validationEngine";
import { techniqueSheetService } from "@/services/techniqueSheetService";
import type { TechniqueSheetRecord, TechniqueSheetCardData } from "@/services/techniqueSheetService";
import { FloatingDesignerButton } from "@/components/ui/FloatingDesignerButton";
import { useInspectorProfile } from "@/contexts/InspectorProfileContext";
import { ProfileSelectionDialog } from "@/components/inspector";
import { useExportCaptures } from "@/hooks/useExportCaptures";
import { testCards, type TestCard } from "@/data/testCards";
import { CurrentShapeHeader } from "@/components/CurrentShapeHeader";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useLicense } from "@/contexts/LicenseContext";
import { DiagnosticsExportDialog } from "@/components/support/DiagnosticsExportDialog";
import { SelfDiagnosticPanel } from "@/components/diagnostics/SelfDiagnosticPanel";
import { OfflineUpdateDialog } from "@/components/updates/OfflineUpdateDialog";
import { LicenseWarningBanner } from "@/components/LicenseWarningBanner";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { isElectron } = useLicense();
  const { needsProfileSelection, isLoading: profileLoading } = useInspectorProfile();
  const { saveCard, updateCard, getCard } = useSavedCards();
  const [standard, setStandard] = useState<StandardType>("AMS-STD-2154E");
  const [activeTab, setActiveTab] = useState("setup");
  const [reportMode, setReportMode] = useState<"Technique" | "Report">("Technique");
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [activePart, setActivePart] = useState<"A" | "B">("A");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [diagnosticsDialogOpen, setDiagnosticsDialogOpen] = useState(false);
  const [diagnosticsPanelOpen, setDiagnosticsPanelOpen] = useState(false);
  const [offlineUpdateDialogOpen, setOfflineUpdateDialogOpen] = useState(false);
  const [licenseWarningDismissed, setLicenseWarningDismissed] = useState(false);
  const [capturedDrawing, setCapturedDrawing] = useState<string | undefined>();
  const [calibrationBlockDiagram, setCalibrationBlockDiagram] = useState<string | undefined>();
  const [viewer3DOpen, setViewer3DOpen] = useState(false); // Start collapsed by default
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Smart capture system for export
  const {
    captures: exportCaptures,
    captureTechnicalDrawing,
    captureCalibrationBlock,
    captureAngleBeamBlock,
    captureE2375Diagram,
    captureScanDirections,
    isCapturing: isCaptureInProgress,
  } = useExportCaptures();

  // State for captured scan directions drawing
  const [capturedScanDirections, setCapturedScanDirections] = useState<string | undefined>();
  // State for angle beam calibration diagram
  const [angleBeamDiagram, setAngleBeamDiagram] = useState<string | undefined>();
  // State for E2375 scan directions diagram
  const [e2375Diagram, setE2375Diagram] = useState<string | undefined>();

  const [inspectionSetup, setInspectionSetup] = useState<InspectionSetupData>({
    partNumber: "",
    partName: "",
    material: "",
    materialSpec: "",
    partType: "",
    partThickness: 25.0,
    partLength: 100.0,
    partWidth: 50.0,
    diameter: 0,
  });

  const [inspectionSetupB, setInspectionSetupB] = useState<InspectionSetupData>({
    partNumber: "",
    partName: "",
    material: "",
    materialSpec: "",
    partType: "",
    partThickness: 25.0,
    partLength: 100.0,
    partWidth: 50.0,
    diameter: 0,
  });

  const [equipment, setEquipment] = useState<EquipmentData>({
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
  });

  const [equipmentB, setEquipmentB] = useState<EquipmentData>({
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
  });

  const [calibration, setCalibration] = useState<CalibrationData>({
    standardType: "",
    referenceMaterial: "",
    fbhSizes: "",
    metalTravelDistance: 0,
    blockDimensions: "",
    blockSerialNumber: "",
    lastCalibrationDate: "",
  });

  const [calibrationB, setCalibrationB] = useState<CalibrationData>({
    standardType: "",
    referenceMaterial: "",
    fbhSizes: "",
    metalTravelDistance: 0,
    blockDimensions: "",
    blockSerialNumber: "",
    lastCalibrationDate: "",
  });

  const [scanParameters, setScanParameters] = useState<ScanParametersData>({
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
  });

  const [scanParametersB, setScanParametersB] = useState<ScanParametersData>({
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
  });

  const [acceptanceCriteria, setAcceptanceCriteria] = useState<AcceptanceCriteriaData>({
    acceptanceClass: "",
    singleDiscontinuity: "",
    multipleDiscontinuities: "",
    linearDiscontinuity: "",
    backReflectionLoss: 50,
    noiseLevel: "",
    specialRequirements: "",
  });

  const [acceptanceCriteriaB, setAcceptanceCriteriaB] = useState<AcceptanceCriteriaData>({
    acceptanceClass: "",
    singleDiscontinuity: "",
    multipleDiscontinuities: "",
    linearDiscontinuity: "",
    backReflectionLoss: 50,
    noiseLevel: "",
    specialRequirements: "",
  });

  const [documentation, setDocumentation] = useState<DocumentationData>({
    inspectorName: "",
    inspectorCertification: "",
    inspectorLevel: "",
    certifyingOrganization: "",
    inspectionDate: new Date().toISOString().split('T')[0],
    procedureNumber: "",
    drawingReference: "",
    revision: "A",
    additionalNotes: "",
    approvalRequired: false,
  });

  const [documentationB, setDocumentationB] = useState<DocumentationData>({
    inspectorName: "",
    inspectorCertification: "",
    inspectorLevel: "",
    certifyingOrganization: "",
    inspectionDate: new Date().toISOString().split('T')[0],
    procedureNumber: "",
    drawingReference: "",
    revision: "A",
    additionalNotes: "",
    approvalRequired: false,
  });

  const [scanDetails, setScanDetails] = useState<ScanDetailsData>({
    scanDetails: []
  });

  const [scanDetailsB, setScanDetailsB] = useState<ScanDetailsData>({
    scanDetails: []
  });

  const [scanPlan, setScanPlan] = useState<ScanPlanData>({
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
      }
    ]
  });

  const [scanPlanB, setScanPlanB] = useState<ScanPlanData>({
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
      }
    ]
  });

  const [inspectionReport, setInspectionReport] = useState<InspectionReportData>({
    documentNo: "",
    currentRevision: "0",
    revisionDate: new Date().toISOString().split('T')[0],
    customerName: "",
    poNumber: "",
    itemDescription: "",
    materialGrade: "",
    workOrderNumber: "",
    poSerialNumber: "",
    quantity: "01 no",
    samplePoSlNo: "",
    sampleSerialNo: "01",
    sampleQuantity: "01 No",
    thickness: "",
    typeOfScan: "Ring scan",
    testingEquipment: "",
    tcgApplied: "Yes",
    testStandard: "",
    observations: "",
    results: "Accepted",
    approvedBy: "",
    partDiagramImage: undefined,
    probeDetails: [],
    scans: [],
    remarks: [],
  });

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [savedSheets, setSavedSheets] = useState<TechniqueSheetRecord[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSavedCardsDialogOpen, setIsSavedCardsDialogOpen] = useState(false);
  const [sheetNameInput, setSheetNameInput] = useState("");
  const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
  const [currentSheetName, setCurrentSheetName] = useState("");
  
  // Track local card for updates
  const [currentLocalCardId, setCurrentLocalCardId] = useState<string | null>(null);

  const [isSavingSheet, setIsSavingSheet] = useState(false);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [loadingSheetId, setLoadingSheetId] = useState<string | null>(null);
  const [deletingSheetId, setDeletingSheetId] = useState<string | null>(null);
  
  // Auto-fill logic when standard changes
  useEffect(() => {
    if (standard && standardRules[standard]) {
      const rules = standardRules[standard];
      
      if (!isSplitMode || activePart === "A") {
        setAcceptanceCriteria(prev => ({
          ...prev,
          acceptanceClass: prev.acceptanceClass || rules.defaultAcceptanceClass
        }));
        setScanParameters(prev => ({
          ...prev,
          coverage: prev.coverage === 100 ? rules.scanCoverageDefault : prev.coverage
        }));
      } else {
        setAcceptanceCriteriaB(prev => ({
          ...prev,
          acceptanceClass: prev.acceptanceClass || rules.defaultAcceptanceClass
        }));
        setScanParametersB(prev => ({
          ...prev,
          coverage: prev.coverage === 100 ? rules.scanCoverageDefault : prev.coverage
        }));
      }
    }
  }, [standard, isSplitMode, activePart]);

  // Auto-capture technical drawing when visiting the drawing tab
  useEffect(() => {
    if (activeTab === 'drawing' && reportMode === 'Technique') {
      const timer = setTimeout(async () => {
        const success = await captureTechnicalDrawing();
        if (success && exportCaptures.technicalDrawing) {
          setCapturedDrawing(exportCaptures.technicalDrawing);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, reportMode, captureTechnicalDrawing, exportCaptures.technicalDrawing]);

  // Auto-capture calibration block diagram when visiting the calibration tab
  useEffect(() => {
    if (activeTab === 'calibration' && reportMode === 'Technique') {
      const timer = setTimeout(async () => {
        const success = await captureCalibrationBlock();
        if (success && exportCaptures.calibrationBlockDiagram) {
          setCalibrationBlockDiagram(exportCaptures.calibrationBlockDiagram);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, reportMode, captureCalibrationBlock, exportCaptures.calibrationBlockDiagram]);

  // Auto-capture scan directions drawing when visiting the scandetails tab
  useEffect(() => {
    if (activeTab === 'scandetails' && reportMode === 'Technique') {
      const timer = setTimeout(async () => {
        const success = await captureScanDirections();
        if (success && exportCaptures.scanDirectionsView) {
          setCapturedScanDirections(exportCaptures.scanDirectionsView);
        }
      }, 800); // Slightly longer delay to ensure arrows are rendered
      return () => clearTimeout(timer);
    }
  }, [activeTab, reportMode, captureScanDirections, exportCaptures.scanDirectionsView]);

  // CRITICAL: Reset captured drawings when part type or key dimensions change
  // This ensures PDF export always uses drawings that match the current shape
  useEffect(() => {
    // Clear all captured drawings when geometry changes
    setCapturedDrawing(undefined);
    setCapturedScanDirections(undefined);
    setCalibrationBlockDiagram(undefined);
    setAngleBeamDiagram(undefined);
    setE2375Diagram(undefined);
  }, [
    inspectionSetup.partType,
    inspectionSetup.diameter,
    inspectionSetup.innerDiameter,
    inspectionSetup.partThickness,
    inspectionSetup.partLength,
    inspectionSetup.partWidth,
    inspectionSetup.isHollow,
    inspectionSetup.coneTopDiameter,
    inspectionSetup.coneBottomDiameter,
    inspectionSetup.coneHeight,
  ]);

  // Also reset for Part B in split mode
  useEffect(() => {
    if (isSplitMode) {
      // When Part B geometry changes, the drawings will be re-captured on export
      // Note: We share the same captured drawings states, so they'll be updated
      // based on the active part when export is triggered
    }
  }, [
    isSplitMode,
    inspectionSetupB.partType,
    inspectionSetupB.diameter,
    inspectionSetupB.innerDiameter,
    inspectionSetupB.partThickness,
    inspectionSetupB.partLength,
    inspectionSetupB.partWidth,
    inspectionSetupB.isHollow,
  ]);

  // Auto-fill logic when material changes - Part A
  useEffect(() => {
    if (inspectionSetup.material && inspectionSetup.partThickness) {
      const recommendedFreq = getRecommendedFrequency(
        inspectionSetup.partThickness, 
        inspectionSetup.material as MaterialType
      );
      
      if (equipment.frequency === "5.0" || !equipment.frequency) {
        setEquipment(prev => ({
          ...prev,
          frequency: recommendedFreq
        }));
      }
      
      const metalTravel = calculateMetalTravel(inspectionSetup.partThickness);
      setCalibration(prev => ({
        ...prev,
        metalTravelDistance: prev.metalTravelDistance === 0 ? metalTravel : prev.metalTravelDistance
      }));
    }
  }, [inspectionSetup.material, inspectionSetup.partThickness, equipment.frequency]);
  
  // Auto-fill logic when material changes - Part B
  useEffect(() => {
    if (isSplitMode && inspectionSetupB.material && inspectionSetupB.partThickness) {
      const recommendedFreq = getRecommendedFrequency(
        inspectionSetupB.partThickness, 
        inspectionSetupB.material as MaterialType
      );
      
      if (equipmentB.frequency === "5.0" || !equipmentB.frequency) {
        setEquipmentB(prev => ({
          ...prev,
          frequency: recommendedFreq
        }));
      }
      
      const metalTravel = calculateMetalTravel(inspectionSetupB.partThickness);
      setCalibrationB(prev => ({
        ...prev,
        metalTravelDistance: prev.metalTravelDistance === 0 ? metalTravel : prev.metalTravelDistance
      }));
    }
  }, [isSplitMode, inspectionSetupB.material, inspectionSetupB.partThickness, equipmentB.frequency]);
  
  // Auto-fill couplant when transducer type changes - Part A
  useEffect(() => {
    if (equipment.transducerType && inspectionSetup.material) {
      const recommendedCouplant = getCouplantRecommendation(
        equipment.transducerType,
        inspectionSetup.material as MaterialType
      );
      
      setEquipment(prev => ({
        ...prev,
        couplant: prev.couplant || recommendedCouplant
      }));
    }
  }, [equipment.transducerType, inspectionSetup.material]);
  
  // Auto-fill couplant when transducer type changes - Part B
  useEffect(() => {
    if (isSplitMode && equipmentB.transducerType && inspectionSetupB.material) {
      const recommendedCouplant = getCouplantRecommendation(
        equipmentB.transducerType,
        inspectionSetupB.material as MaterialType
      );
      
      setEquipmentB(prev => ({
        ...prev,
        couplant: prev.couplant || recommendedCouplant
      }));
    }
  }, [isSplitMode, equipmentB.transducerType, inspectionSetupB.material]);

  // Copy Part A data to Part B
  const copyPartAToB = () => {
    setInspectionSetupB({ ...inspectionSetup });
    setEquipmentB({ ...equipment });
    setCalibrationB({ ...calibration });
    setScanParametersB({ ...scanParameters });
    setAcceptanceCriteriaB({ ...acceptanceCriteria });
    setDocumentationB({ ...documentation });
    setScanDetailsB({ ...scanDetails });
    toast.success("Part A copied to Part B");
  };

  // Get current data based on active part - memoized to prevent unnecessary recalculations
  const currentData = useMemo(() => {
    if (!isSplitMode || activePart === "A") {
      return {
        inspectionSetup,
        equipment,
        calibration,
        scanParameters,
        acceptanceCriteria,
        documentation,
        scanDetails,
        scanPlan,
        setInspectionSetup,
        setEquipment,
        setCalibration,
        setScanParameters,
        setAcceptanceCriteria,
        setDocumentation,
        setScanDetails,
        setScanPlan,
      };
    } else {
      return {
        inspectionSetup: inspectionSetupB,
        equipment: equipmentB,
        calibration: calibrationB,
        scanParameters: scanParametersB,
        acceptanceCriteria: acceptanceCriteriaB,
        documentation: documentationB,
        scanDetails: scanDetailsB,
        scanPlan: scanPlanB,
        setInspectionSetup: setInspectionSetupB,
        setEquipment: setEquipmentB,
        setCalibration: setCalibrationB,
        setScanParameters: setScanParametersB,
        setAcceptanceCriteria: setAcceptanceCriteriaB,
        setDocumentation: setDocumentationB,
        setScanDetails: setScanDetailsB,
        setScanPlan: setScanPlanB,
      };
    }
  }, [
    isSplitMode, activePart,
    inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria, documentation, scanDetails, scanPlan,
    inspectionSetupB, equipmentB, calibrationB, scanParametersB, acceptanceCriteriaB, documentationB, scanDetailsB, scanPlanB
  ]);

  const buildTechniqueSheetPayload = (): TechniqueSheetCardData => ({
    standard,
    activeTab,
    reportMode,
    isSplitMode,
    activePart,
    partA: {
      inspectionSetup,
      equipment,
      calibration,
      scanParameters,
      acceptanceCriteria,
      documentation,
      scanDetails,
    },
    partB: {
      inspectionSetup: inspectionSetupB,
      equipment: equipmentB,
      calibration: calibrationB,
      scanParameters: scanParametersB,
      acceptanceCriteria: acceptanceCriteriaB,
      documentation: documentationB,
      scanDetails: scanDetailsB,
    },
    inspectionReport,
  });

  const applyLoadedSheet = (record: TechniqueSheetRecord) => {
    const data = record.data;
    if (!data) {
      toast.error('Saved card is missing data.');
      return;
    }

    setStandard(data.standard || "AMS-STD-2154E");
    setActiveTab(data.activeTab || "setup");
    setReportMode(data.reportMode || "Technique");
    setIsSplitMode(Boolean(data.isSplitMode));
    setActivePart(data.activePart || "A");

    setInspectionSetup(data.partA?.inspectionSetup || inspectionSetup);
    setEquipment(data.partA?.equipment || equipment);
    setCalibration(data.partA?.calibration || calibration);
    setScanParameters(data.partA?.scanParameters || scanParameters);
    setAcceptanceCriteria(data.partA?.acceptanceCriteria || acceptanceCriteria);
    setDocumentation(data.partA?.documentation || documentation);
    setScanDetails(data.partA?.scanDetails || { scanDetails: [] });

    setInspectionSetupB(data.partB?.inspectionSetup || inspectionSetupB);
    setEquipmentB(data.partB?.equipment || equipmentB);
    setCalibrationB(data.partB?.calibration || calibrationB);
    setScanParametersB(data.partB?.scanParameters || scanParametersB);
    setAcceptanceCriteriaB(data.partB?.acceptanceCriteria || acceptanceCriteriaB);
    setDocumentationB(data.partB?.documentation || documentationB);
    setScanDetailsB(data.partB?.scanDetails || { scanDetails: [] });

    setInspectionReport(data.inspectionReport || inspectionReport);

    setCurrentSheetId(record.id);
    setCurrentSheetName(record.sheetName);
    setSheetNameInput(record.sheetName);
  };

  // Handle loading a local saved card (from localStorage)
  const handleLoadLocalCard = (card: SavedCard) => {
    const data = (card as any).data;
    if (!data) {
      toast.error('Saved card is missing data.');
      return;
    }

    // Track this card ID for future saves
    setCurrentLocalCardId(card.id);
    setCurrentSheetName(card.name);

    // Apply the card data to the form
    if (data.standard) setStandard(data.standard as StandardType);
    if (data.activeTab) setActiveTab(data.activeTab);
    if (data.reportMode) setReportMode(data.reportMode);
    setIsSplitMode(Boolean(data.isSplitMode));
    if (data.activePart) setActivePart(data.activePart);

    // Apply Part A data
    if (data.partA?.inspectionSetup) setInspectionSetup(data.partA.inspectionSetup);
    if (data.partA?.equipment) setEquipment(data.partA.equipment);
    if (data.partA?.calibration) setCalibration(data.partA.calibration);
    if (data.partA?.scanParameters) setScanParameters(data.partA.scanParameters);
    if (data.partA?.acceptanceCriteria) setAcceptanceCriteria(data.partA.acceptanceCriteria);
    if (data.partA?.documentation) setDocumentation(data.partA.documentation);
    if (data.partA?.scanDetails) setScanDetails(data.partA.scanDetails);

    // Apply Part B data
    if (data.partB?.inspectionSetup) setInspectionSetupB(data.partB.inspectionSetup);
    if (data.partB?.equipment) setEquipmentB(data.partB.equipment);
    if (data.partB?.calibration) setCalibrationB(data.partB.calibration);
    if (data.partB?.scanParameters) setScanParametersB(data.partB.scanParameters);
    if (data.partB?.acceptanceCriteria) setAcceptanceCriteriaB(data.partB.acceptanceCriteria);
    if (data.partB?.documentation) setDocumentationB(data.partB.documentation);
    if (data.partB?.scanDetails) setScanDetailsB(data.partB.scanDetails);

    // Apply inspection report if available
    if (data.inspectionReport) setInspectionReport(data.inspectionReport);

    toast.success(`נטען כרטיס: ${card.name}`);
  };

  const refreshSavedSheets = async () => {
    if (!user || !organizationId) return;
    setIsLoadingSheets(true);
    try {
      const sheets = await techniqueSheetService.loadTechniqueSheets(user.id, organizationId);
      const sorted = [...sheets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setSavedSheets(sorted);
    } catch (error) {
      logError('Failed to load saved technique cards', error);
      toast.error('Unable to load saved cards.');
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const handleOpenSavedCards = () => {
    if (!user) {
      toast.error('You must be signed in to manage saved cards.');
      return;
    }
    if (!organizationId) {
      toast.error('Workspace is not ready yet. Please try again in a moment.');
      return;
    }
    setIsSavedCardsDialogOpen(true);
  };

  const handleLoadSheet = async (sheetId: string) => {
    if (!user || !organizationId) return;
    setLoadingSheetId(sheetId);
    try {
      const sheet = await techniqueSheetService.loadTechniqueSheet({
        sheetId,
        userId: user.id,
        orgId: organizationId,
      });
      applyLoadedSheet(sheet);
      setIsSavedCardsDialogOpen(false);
      toast.success(`Loaded card "${sheet.sheetName}"`);
    } catch (error) {
      logError('Failed to load technique card', error);
      toast.error('Unable to load the selected card.');
    } finally {
      setLoadingSheetId(null);
    }
  };

  const handleDeleteSheet = async (sheetId: string) => {
    if (!user || !organizationId) return;
    if (!confirm('Delete this saved card? This action cannot be undone.')) {
      return;
    }
    setDeletingSheetId(sheetId);
    try {
      await techniqueSheetService.deleteTechniqueSheet(sheetId, user.id, organizationId);
      if (currentSheetId === sheetId) {
        setCurrentSheetId(null);
        setCurrentSheetName("");
      }
      await refreshSavedSheets();
      toast.success('Card deleted.');
    } catch (error) {
      logError('Failed to delete technique card', error);
      toast.error('Unable to delete the selected card.');
    } finally {
      setDeletingSheetId(null);
    }
  };

  const performSave = async (name: string, sheetId?: string) => {
    if (!user || !organizationId) {
      toast.error('You must be signed in to save.');
      return;
    }

    setIsSavingSheet(true);
    try {
      const payload = buildTechniqueSheetPayload();
      const saved = await techniqueSheetService.saveTechniqueSheet({
        sheetId,
        sheetName: name.trim(),
        standard,
        data: payload,
        userId: user.id,
        orgId: organizationId,
      });
      setCurrentSheetId(saved.id);
      setCurrentSheetName(saved.sheetName);
      setSheetNameInput(saved.sheetName);
      setIsSaveDialogOpen(false);
      await refreshSavedSheets();
      toast.success(sheetId ? 'Technique card updated.' : 'Technique card saved.');
    } catch (error) {
      logError('Failed to save technique card', error);
      toast.error('Unable to save the technique card.');
    } finally {
      setIsSavingSheet(false);
    }
  };

  const handleSaveDialogConfirm = async () => {
    const trimmedName = sheetNameInput.trim();
    if (!trimmedName) {
      toast.error('נא להזין שם לכרטיס.');
      return;
    }
    // Save locally to localStorage
    performLocalSave(trimmedName);
  };

  // Remove localStorage auto-save - now using database with manual save
  // Keep localStorage only for temporary draft data
  useEffect(() => {
    const data = {
      standard,
      isSplitMode,
      activePart,
      inspectionSetup,
      equipment,
      calibration,
      scanParameters,
      acceptanceCriteria,
      documentation,
      scanDetails,
      inspectionSetupB,
      equipmentB,
      calibrationB,
      scanParametersB,
      acceptanceCriteriaB,
      documentationB,
      scanDetailsB,
    };
    localStorage.setItem("techniqueSheet_draft", JSON.stringify(data));
  }, [standard, isSplitMode, activePart, inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria, documentation, scanDetails, inspectionSetupB, equipmentB, calibrationB, scanParametersB, acceptanceCriteriaB, documentationB, scanDetailsB]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("techniqueSheet_draft");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStandard(data.standard || "AMS-STD-2154E");
        setIsSplitMode(data.isSplitMode || false);
        setActivePart(data.activePart || "A");
        setInspectionSetup(data.inspectionSetup || inspectionSetup);
        setEquipment(data.equipment || equipment);
        setCalibration(data.calibration || calibration);
        setScanParameters(data.scanParameters || scanParameters);
        setAcceptanceCriteria(data.acceptanceCriteria || acceptanceCriteria);
        setDocumentation(data.documentation || documentation);
        setScanDetails(data.scanDetails || { scanDetails: [] });
        setInspectionSetupB(data.inspectionSetupB || inspectionSetupB);
        setEquipmentB(data.equipmentB || equipmentB);
        setCalibrationB(data.calibrationB || calibrationB);
        setScanParametersB(data.scanParametersB || scanParametersB);
        setAcceptanceCriteriaB(data.acceptanceCriteriaB || acceptanceCriteriaB);
        setDocumentationB(data.documentationB || documentationB);
        setScanDetailsB(data.scanDetailsB || { scanDetails: [] });
      } catch (error) {
        logError("Failed to load draft data", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const loadOrganizations = async () => {
      try {
        const organizations = await techniqueSheetService.fetchOrganizations(user.id);
        if (cancelled) return;
        if (organizations.length > 0) {
          setOrganizationId(organizations[0].id);
        } else {
          setOrganizationId(null);
          toast.error('No organizations available. Saving is disabled.');
        }
      } catch (error) {
        if (!cancelled) {
          logError('Failed to load organizations', error);
          toast.error('Unable to load workspace information. Saving is temporarily unavailable.');
        }
      }
    };

    loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Auto-save with debounce - saves to database 3 seconds after user stops editing
  const autoSaveData = useMemo(() => buildTechniqueSheetPayload(), [
    standard, activeTab, reportMode, isSplitMode, activePart,
    inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria, documentation, scanDetails,
    inspectionSetupB, equipmentB, calibrationB, scanParametersB, acceptanceCriteriaB, documentationB, scanDetailsB,
    inspectionReport
  ]);

  const { status: autoSaveStatus, lastSaved, forceSave } = useAutoSave({
    data: autoSaveData,
    onSave: async (data) => {
      if (!user || !organizationId) {
        throw new Error('Not signed in or no organization');
      }

      // Generate automatic draft name based on timestamp and standard
      const now = new Date();
      const autoName = currentSheetName || `Draft - ${standard} - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

      // Auto-save: create new sheet if none exists, or update existing one
      const saved = await techniqueSheetService.saveTechniqueSheet({
        sheetId: currentSheetId || undefined,
        sheetName: autoName,
        standard,
        data,
        userId: user.id,
        orgId: organizationId,
      });

      // Update current sheet ID and name if this was a new save
      if (!currentSheetId) {
        setCurrentSheetId(saved.id);
        setCurrentSheetName(saved.sheetName);
        setSheetNameInput(saved.sheetName);
      }
    },
    delay: 3000, // 3 seconds debounce
    enabled: Boolean(user && organizationId), // Auto-save whenever signed in and has organization
  });

  useEffect(() => {
    if (!isSavedCardsDialogOpen || !user || !organizationId) return;
    refreshSavedSheets();
  }, [isSavedCardsDialogOpen, user, organizationId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'e':
            e.preventDefault();
            setExportDialogOpen(true);
            break;
          case 'n':
            e.preventDefault();
            handleNewProject();
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria, documentation, inspectionReport, reportMode]);

  // Calculate completion with weighted fields based on standard requirements
  // Weights: CRITICAL=5, HIGH=3, MEDIUM=2, LOW=1 (per MIL-STD-2154E / AMS-STD-2154E)
  // Memoized to prevent recalculation on every render
  const completionPercent = useMemo(() => {
    let score = 0;
    const maxScore = 85; // Total possible points

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

  // Memoized completed fields count
  const completedFieldsCount = useMemo(() => {
    const totalFields = reportMode === "Technique" ? 50 : 40;
    return Math.round((completionPercent / 100) * totalFields);
  }, [completionPercent, reportMode]);

  const handleNewProject = useCallback(() => {
    if (confirm('Start a new project? Unsaved changes will be lost.')) {
      setCurrentLocalCardId(null);
      setCurrentSheetName('');
      window.location.reload();
    }
  }, []);

  // Build the card data object for saving
  const buildCardData = useCallback(() => {
    return {
      standard,
      activeTab,
      reportMode,
      isSplitMode,
      activePart,
      partA: {
        inspectionSetup,
        equipment,
        calibration,
        scanParameters,
        acceptanceCriteria,
        documentation,
        scanDetails,
      },
      partB: isSplitMode ? {
        inspectionSetup: inspectionSetupB,
        equipment: equipmentB,
        calibration: calibrationB,
        scanParameters: scanParametersB,
        acceptanceCriteria: acceptanceCriteriaB,
        documentation: documentationB,
        scanDetails: scanDetailsB,
      } : undefined,
      inspectionReport: reportMode === 'Report' ? inspectionReport : undefined,
    };
  }, [
    standard, activeTab, reportMode, isSplitMode, activePart,
    inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria, documentation, scanDetails,
    inspectionSetupB, equipmentB, calibrationB, scanParametersB, acceptanceCriteriaB, documentationB, scanDetailsB,
    inspectionReport
  ]);

  const handleSave = async () => {
    if (isSavingSheet) return;

    // Build the card data
    const cardData = buildCardData();

    // If we have a current local card, update it
    if (currentLocalCardId) {
      const existingCard = getCard(currentLocalCardId);
      if (existingCard) {
        updateCard(currentLocalCardId, {
          data: cardData,
          completionPercent,
          standard,
        } as any);
        toast.success(`כרטיס "${existingCard.name}" עודכן בהצלחה!`);
        return;
      }
    }

    // No existing card - ask for name
    const suggestedName =
      currentData.inspectionSetup.partName ||
      currentData.inspectionSetup.partNumber ||
      `כרטיס טכניקה ${new Date().toLocaleDateString('he-IL')}`;
    setSheetNameInput(suggestedName);
    setIsSaveDialogOpen(true);
  };

  // Actually save the local card with the given name
  const performLocalSave = (name: string) => {
    const cardData = buildCardData();
    
    const savedCard = saveCard({
      name,
      description: `${currentData.inspectionSetup.partName || ''} - ${standard}`,
      type: reportMode === 'Report' ? 'report' : 'technique',
      standard,
      completionPercent,
      tags: [],
      isFavorite: false,
      isArchived: false,
      isSplitMode,
      inspectionSetup: currentData.inspectionSetup,
      equipment: currentData.equipment,
      calibration: currentData.calibration,
      scanParameters: currentData.scanParameters,
      acceptanceCriteria: currentData.acceptanceCriteria,
      documentation: currentData.documentation,
      inspectionSetupB: isSplitMode ? inspectionSetupB : undefined,
      equipmentB: isSplitMode ? equipmentB : undefined,
      calibrationB: isSplitMode ? calibrationB : undefined,
      scanParametersB: isSplitMode ? scanParametersB : undefined,
      acceptanceCriteriaB: isSplitMode ? acceptanceCriteriaB : undefined,
      documentationB: isSplitMode ? documentationB : undefined,
      data: cardData,
    } as any);
    
    setCurrentLocalCardId(savedCard.id);
    setCurrentSheetName(name);
    toast.success(`כרטיס "${name}" נשמר בהצלחה!`);
    setIsSaveDialogOpen(false);
  };

  const handleExportPDF = async () => {
    if (reportMode === "Technique") {
      // Show loading toast
      toast.loading('Preparing drawings for export...', { id: 'export-prep' });

      // Capture all drawings by visiting each tab temporarily
      const originalTab = activeTab;

      // Import smartCapture for direct DOM capture and beam type check
      const { smartCapture } = await import('@/utils/export/captureEngine');
      const { getBeamRequirement } = await import('@/utils/beamTypeClassification');

      try {
        // Step 1: Go to Setup tab to capture the technical drawing
        // The RealTimeTechnicalDrawing component with id="technical-drawing-canvas" is in the Setup tab
        console.log('[PDF Export] Step 1: Going to Setup tab for technical drawing...');
        setActiveTab('setup');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for canvas to render

        const drawingCanvas = document.getElementById('technical-drawing-canvas') as HTMLCanvasElement;
        console.log('[PDF Export] Technical drawing canvas found:', !!drawingCanvas);

        if (drawingCanvas) {
          try {
            // Create a high-resolution copy of the canvas for better print quality
            const scale = 3; // 3x resolution for crisp printing
            const highResCanvas = document.createElement('canvas');
            highResCanvas.width = drawingCanvas.width * scale;
            highResCanvas.height = drawingCanvas.height * scale;
            const ctx = highResCanvas.getContext('2d');
            if (ctx) {
              // DON'T fill with white background - keep the dark background with white lines
              // This preserves the original technical drawing appearance
              ctx.scale(scale, scale);
              ctx.drawImage(drawingCanvas, 0, 0);
              const drawingImage = highResCanvas.toDataURL('image/png', 1.0);
              console.log('[PDF Export] Technical drawing captured, size:', drawingImage.length);
              if (drawingImage && drawingImage.length > 100) {
                setCapturedDrawing(drawingImage);
              }
            }
          } catch (error) {
            console.warn('[PDF Export] Could not capture technical drawing:', error);
          }
        } else {
          console.warn('[PDF Export] Technical drawing canvas not found! Make sure a part type is selected.');
        }

        // Step 2: Go to calibration tab and capture straight beam (FBH) diagram
        console.log('[PDF Export] Step 2: Going to Calibration tab for FBH diagram...');
        setActiveTab('calibration');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for SVG to render

        // First, make sure we're on the "straight" sub-tab for FBH capture
        const straightTabTrigger = document.querySelector('[value="straight"]') as HTMLElement;
        console.log('[PDF Export] Straight tab trigger found:', !!straightTabTrigger);
        if (straightTabTrigger) {
          straightTabTrigger.click();
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Directly capture using smartCapture instead of relying on stale state
        const calibrationResult = await smartCapture([
          '#calibration-block-svg',
          'svg#calibration-block-svg',
          '[data-testid="calibration-block-diagram"]',
          'svg[data-testid="calibration-block-diagram"]',
          '.fbh-straight-beam-drawing',
          'svg.fbh-straight-beam-drawing',
          '.calibration-drawing svg',
          '.calibration-tab svg',
        ], { scale: 3, quality: 1.0, backgroundColor: 'white', maxWidth: 1800, maxHeight: 1200 });

        console.log('[PDF Export] FBH calibration capture result:', calibrationResult.success, calibrationResult.data?.length || 0);
        if (calibrationResult.success && calibrationResult.data) {
          setCalibrationBlockDiagram(calibrationResult.data);
        }

        // Step 2b: Capture angle beam diagram if this part type requires it
        // Check if the current part geometry requires both beam types
        const beamRequirement = getBeamRequirement(currentData.inspectionSetup.partType, currentData.inspectionSetup.isHollow);
        console.log('[PDF Export] Beam requirement for', currentData.inspectionSetup.partType, ':', beamRequirement);

        if (beamRequirement === 'both') {
          // Switch to angle beam sub-tab
          const angleTabTrigger = document.querySelector('[value="angle"]') as HTMLElement;
          console.log('[PDF Export] Angle tab trigger found:', !!angleTabTrigger);
          if (angleTabTrigger) {
            angleTabTrigger.click();
            await new Promise(resolve => setTimeout(resolve, 800)); // Wait for angle beam component to render
          }

          const angleBeamResult = await smartCapture([
            '[data-testid="angle-beam-calibration-block"]',
            '.angle-beam-calibration-block',
            '.angle-beam-calibration-block svg',
          ], { scale: 3, quality: 1.0, backgroundColor: 'white', maxWidth: 1800, maxHeight: 1200 });

          console.log('[PDF Export] Angle beam capture result:', angleBeamResult.success, angleBeamResult.data?.length || 0);
          if (angleBeamResult.success && angleBeamResult.data) {
            setAngleBeamDiagram(angleBeamResult.data);
          }
        }

        // Step 3: Go to scan details tab and capture E2375 diagram
        console.log('[PDF Export] Step 3: Going to Scan Details tab for E2375 diagram...');
        setActiveTab('scandetails');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for image to render

        // Check if E2375 image element exists before capture
        const e2375ImgElement = document.querySelector('[data-testid="e2375-diagram-img"]');
        console.log('[PDF Export] E2375 img element found:', !!e2375ImgElement);

        // Capture E2375 standard diagram (look for the actual img element first)
        const e2375Result = await smartCapture([
          '[data-testid="e2375-diagram-img"]',  // Direct image element with testid
          '[data-testid="e2375-diagram"] img',  // Image inside container
          '.e2375-diagram-image img',
          '.e2375-diagram-container img',
          '[data-testid="e2375-diagram"]',
        ], { scale: 2, quality: 1.0, backgroundColor: 'white', maxWidth: 1200, maxHeight: 800 });

        console.log('[PDF Export] E2375 capture result:', e2375Result.success, e2375Result.data?.length || 0);
        if (e2375Result.success && e2375Result.data) {
          setE2375Diagram(e2375Result.data);
        }

        // Note: InspectionPlanViewer (scan-directions-canvas) is not currently rendered in the app.
        // The E2375 diagram from above serves as the scan directions visualization.

        // Step 4: Return to original tab
        console.log('[PDF Export] Step 4: Returning to original tab...');
        setActiveTab(originalTab);

        // CRITICAL: Wait for React state to update with new drawings
        // This ensures the export dialog receives the freshly captured drawings
        // 500ms provides buffer for slower machines and complex state updates
        await new Promise(resolve => setTimeout(resolve, 500));

        // Log summary of what was captured
        console.log('[PDF Export] Capture Summary:');
        console.log('  - Technical Drawing: captured');
        console.log('  - FBH Calibration: captured');
        console.log('  - Angle Beam:', beamRequirement === 'both' ? 'captured' : 'not required');
        console.log('  - E2375 Diagram: captured');

        // Dismiss loading and open dialog
        toast.dismiss('export-prep');
        toast.success('Drawings captured successfully!');
        setExportDialogOpen(true);

      } catch (error) {
        console.error('Error capturing drawings:', error);
        toast.dismiss('export-prep');
        toast.error('Some drawings could not be captured');
        // Still open the dialog even if capture fails
        setActiveTab(originalTab);
        setExportDialogOpen(true);
      }
    } else {
      // For inspection reports, open the export dialog
      setExportDialogOpen(true);
    }
  };

  const handleValidate = useCallback(() => {
    const missing = [];
    if (!inspectionSetup.partNumber) missing.push("Part Number");
    if (!equipment.manufacturer) missing.push("Equipment Manufacturer");
    if (!calibration.standardType) missing.push("Calibration Standard");
    if (!acceptanceCriteria.acceptanceClass) missing.push("Acceptance Class");
    if (!documentation.inspectorName) missing.push("Inspector Name");

    if (missing.length > 0) {
      toast.error(`Missing required fields: ${missing.join(", ")}`);
    } else {
      toast.success("All required fields complete!");
    }
  }, [inspectionSetup.partNumber, equipment.manufacturer, calibration.standardType, acceptanceCriteria.acceptanceClass, documentation.inspectorName]);

  // Load test card function - for development/testing
  const loadTestCard = useCallback((cardIndex: number) => {
    const card = testCards[cardIndex - 1];
    if (!card) {
      toast.error(`Test card ${cardIndex} not found`);
      return;
    }

    // Load all data from the test card
    setStandard(card.standard);
    setInspectionSetup(card.inspectionSetup);
    setEquipment(card.equipment);
    setCalibration(card.calibration);
    setScanParameters(card.scanParameters);
    setAcceptanceCriteria(card.acceptanceCriteria);
    setDocumentation(card.documentation);
    setScanDetails(card.scanDetails);

    toast.success(`Loaded test card: ${card.name}`);
    logInfo('Loaded test card', { cardId: card.id, cardName: card.name });
  }, []);

  // Load sample cards from JSON file
  const handleLoadSampleCards = useCallback(async () => {
    try {
      const response = await fetch('/sample-cards.json');
      if (!response.ok) {
        throw new Error('Failed to fetch sample cards');
      }
      const cards = await response.json();

      if (Array.isArray(cards) && cards.length > 0) {
        // Load the first sample card
        const card = cards[0];

        setStandard(card.standard || 'AMS-STD-2154E');
        setInspectionSetup(card.inspectionSetup || inspectionSetup);
        setEquipment(card.equipment || equipment);
        setCalibration(card.calibration || calibration);
        setScanParameters(card.scanParameters || scanParameters);
        setAcceptanceCriteria(card.acceptanceCriteria || acceptanceCriteria);
        setDocumentation(card.documentation || documentation);

        toast.success(`Loaded sample card: ${card.name}`, {
          description: `${cards.length} sample cards available. Use Ctrl+Shift+1/2/3 to load others.`
        });
        logInfo('Loaded sample card', { cardName: card.name });
      } else {
        toast.error('No sample cards found');
      }
    } catch (error) {
      console.error('Error loading sample cards:', error);
      toast.error('Failed to load sample cards');
    }
  }, [inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria, documentation]);

  // Keyboard shortcuts for loading test cards (Ctrl+Shift+1/2/3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        if (e.key === '1') {
          e.preventDefault();
          loadTestCard(1);
        } else if (e.key === '2') {
          e.preventDefault();
          loadTestCard(2);
        } else if (e.key === '3') {
          e.preventDefault();
          loadTestCard(3);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Redirect to auth page if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background fixed inset-0">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show loading while redirecting
  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background fixed inset-0">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background fixed inset-0">
      {/* Profile Selection Dialog */}
      <ProfileSelectionDialog
        open={needsProfileSelection && !profileLoading}
        allowClose={false}
      />

      {/* License Expiry Warning Banner */}
      {!licenseWarningDismissed && (
        <LicenseWarningBanner onDismiss={() => setLicenseWarningDismissed(true)} />
      )}

      {/* Menu Bar - Hidden on Mobile and in Electron (uses native menu) */}
      {!isElectron && (
        <div className="hidden md:block">
          <MenuBar
            onSave={handleSave}
            onOpenSavedCards={handleOpenSavedCards}
            onExport={() => setExportDialogOpen(true)}
            onNew={handleNewProject}
            onSignOut={signOut}
            onOpenDrawingEngine={() => navigate("/drawing-test")}
            onLoadSampleCards={handleLoadSampleCards}
            onExportDiagnostics={() => setDiagnosticsDialogOpen(true)}
            onRunDiagnostics={() => setDiagnosticsPanelOpen(true)}
            onOfflineUpdate={() => setOfflineUpdateDialogOpen(true)}
          />
        </div>
      )}

      {/* Toolbar */}
      <Toolbar
        onSave={handleSave}
        onExport={() => setExportDialogOpen(true)}
        onValidate={handleValidate}
        reportMode={reportMode}
        onReportModeChange={setReportMode}
        isSplitMode={isSplitMode}
        onSplitModeChange={setIsSplitMode}
        activePart={activePart}
        onActivePartChange={setActivePart}
        onCopyAToB={copyPartAToB}
        onOpenSavedCards={handleOpenSavedCards}
        onLoadLocalCard={handleLoadLocalCard}
      />

      {/* Main Content Area - Responsive Layout with proper overflow handling */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Mobile: Compact Header with Standard */}
        <div className="md:hidden border-b border-border bg-card p-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-xs mb-2">Standard</h3>
              <StandardSelector
                value={standard}
                onChange={setStandard}
              />
            </div>
          </div>
        </div>

        {/* Desktop: Left Panel with Standard Selector - Collapsible */}
        <CollapsibleSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          title="Standard"
        >
          <StandardSelector
            value={standard}
            onChange={setStandard}
          />
        </CollapsibleSidebar>

        {/* Center Panel: Main Form - Full width on mobile, flex to fill available space */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-2 md:p-4 flex-shrink-0">
                {reportMode === "Technique" ? (
                  <>
                    {/* Compact header row with Part Type and Progress */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {/* Compact Part Type Indicator */}
                      <CurrentShapeHeader partType={currentData.inspectionSetup.partType} className="flex-shrink-0 max-w-[180px]" />
                      
                      {/* Compact Progress Bar - responsive width */}
                      <div className="flex-1 min-w-[200px] max-w-full">
                        <WebGLLiquidProgress
                          value={completionPercent}
                          completedFields={completedFieldsCount}
                          totalFields={reportMode === "Technique" ? 50 : 40}
                        />
                      </div>
                    </div>

                    <div className="w-full overflow-x-auto scrollbar-hide md:overflow-visible sticky top-0 bg-background z-10 pb-2">
                      <TabsList className="inline-flex flex-nowrap h-10 items-center justify-start md:justify-center rounded-md bg-muted p-1 text-muted-foreground w-max md:w-full">
                        <TabsTrigger value="setup" className="flex-shrink-0 px-3">Setup</TabsTrigger>
                        <TabsTrigger value="equipment" className="flex-shrink-0 px-3">Equipment</TabsTrigger>
                        <TabsTrigger value="scan" className="flex-shrink-0 px-3 whitespace-nowrap">Scan Params</TabsTrigger>
                        <TabsTrigger value="acceptance" className="flex-shrink-0 px-3">Acceptance</TabsTrigger>
                        <TabsTrigger value="scandetails" className="flex-shrink-0 px-3 whitespace-nowrap">Scan Details</TabsTrigger>
                        <TabsTrigger value="docs" className="flex-shrink-0 px-3">Documentation</TabsTrigger>
                        <TabsTrigger value="calibration" className="flex-shrink-0 px-3 whitespace-nowrap">Reference Standard</TabsTrigger>
                        <TabsTrigger value="scanplan" className="flex-shrink-0 px-3 whitespace-nowrap">Scan Plan</TabsTrigger>
                      </TabsList>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Compact header row with Progress for Report mode */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <WebGLLiquidProgress
                          value={completionPercent}
                          completedFields={completedFieldsCount}
                          totalFields={reportMode === "Technique" ? 50 : 40}
                        />
                      </div>
                    </div>

                    <div className="w-full overflow-x-auto scrollbar-hide md:overflow-visible sticky top-0 bg-background z-10 pb-2">
                      <TabsList className="inline-flex flex-nowrap h-10 items-center justify-start md:justify-center rounded-md bg-muted p-1 text-muted-foreground w-max md:w-full">
                        <TabsTrigger value="cover" className="flex-shrink-0 px-4 whitespace-nowrap">Cover Page</TabsTrigger>
                        <TabsTrigger value="diagram" className="flex-shrink-0 px-4 whitespace-nowrap">Part Diagram</TabsTrigger>
                        <TabsTrigger value="probe" className="flex-shrink-0 px-4 whitespace-nowrap">Probe Details</TabsTrigger>
                        <TabsTrigger value="scans" className="flex-shrink-0 px-4">Scans</TabsTrigger>
                        <TabsTrigger value="remarks" className="flex-shrink-0 px-4">Remarks</TabsTrigger>
                      </TabsList>
                    </div>
                  </>
                )}
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 md:px-4 pb-4 min-h-0">
                {reportMode === "Technique" ? (
                  <>
                    <div className="app-panel rounded-md max-w-full">
                      <TabsContent value="setup" className="m-0">
                        <InspectionSetupTab 
                          data={currentData.inspectionSetup} 
                          onChange={currentData.setInspectionSetup}
                          acceptanceClass={currentData.acceptanceCriteria.acceptanceClass}
                        />
                      </TabsContent>

                      <TabsContent value="scandetails" className="m-0">
                        <ScanDetailsTab
                          data={currentData.scanDetails}
                          onChange={currentData.setScanDetails}
                          partType={currentData.inspectionSetup.partType}
                          dimensions={{
                            diameter: currentData.inspectionSetup.diameter,
                            length: currentData.inspectionSetup.partLength,
                            width: currentData.inspectionSetup.partWidth,
                            height: currentData.inspectionSetup.partThickness,
                            thickness: currentData.inspectionSetup.partThickness,
                            outerDiameter: currentData.inspectionSetup.diameter,
                            innerDiameter: currentData.inspectionSetup.innerDiameter,
                            // Cone-specific dimensions
                            coneTopDiameter: currentData.inspectionSetup.coneTopDiameter,
                            coneBottomDiameter: currentData.inspectionSetup.coneBottomDiameter,
                            coneHeight: currentData.inspectionSetup.coneHeight,
                            wallThickness: currentData.inspectionSetup.wallThickness,
                            isHollow: currentData.inspectionSetup.isHollow,
                          }}
                        />
                      </TabsContent>


                      <TabsContent value="equipment" className="m-0">
                        <EquipmentTab
                          data={currentData.equipment}
                          onChange={currentData.setEquipment}
                          partThickness={currentData.inspectionSetup.partThickness}
                          standard={standard}
                        />
                      </TabsContent>

                      <TabsContent value="calibration" className="m-0">
                        <CalibrationTab
                          data={currentData.calibration}
                          onChange={currentData.setCalibration}
                          inspectionSetup={currentData.inspectionSetup}
                          acceptanceClass={currentData.acceptanceCriteria.acceptanceClass}
                          standard={standard}
                        />
                      </TabsContent>

                      <TabsContent value="scan" className="m-0">
                        <ScanParametersTab
                          data={currentData.scanParameters}
                          onChange={currentData.setScanParameters}
                          standard={standard}
                        />
                      </TabsContent>

                      <TabsContent value="acceptance" className="m-0">
                        <AcceptanceCriteriaTab
                          data={currentData.acceptanceCriteria}
                          onChange={currentData.setAcceptanceCriteria}
                          material={currentData.inspectionSetup.materialSpec || currentData.inspectionSetup.material}
                          standard={standard}
                        />
                      </TabsContent>

                      <TabsContent value="docs" className="m-0">
                        <DocumentationTab
                          data={currentData.documentation}
                          onChange={currentData.setDocumentation}
                        />
                      </TabsContent>

                      <TabsContent value="scanplan" className="m-0">
                        <ScanPlanTab
                          data={currentData.scanPlan}
                          onChange={currentData.setScanPlan}
                        />
                      </TabsContent>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="app-panel rounded-md">
                      <TabsContent value="cover" className="m-0">
                        <CoverPageTab 
                          data={inspectionReport} 
                          onChange={(data) => setInspectionReport({ ...inspectionReport, ...data })}
                        />
                      </TabsContent>

                      <TabsContent value="diagram" className="m-0">
                        <PartDiagramTab 
                          partDiagramImage={inspectionReport.partDiagramImage}
                          onChange={(image) => setInspectionReport({ ...inspectionReport, partDiagramImage: image })}
                          partType={inspectionSetup.partType}
                          thickness={inspectionSetup.partThickness.toString()}
                          diameter={inspectionSetup.diameter?.toString()}
                          length={inspectionSetup.partLength.toString()}
                        />
                      </TabsContent>

                      <TabsContent value="probe" className="m-0">
                        <ProbeDetailsTab 
                          probeDetails={inspectionReport.probeDetails}
                          onChange={(probes) => setInspectionReport({ ...inspectionReport, probeDetails: probes })}
                        />
                      </TabsContent>

                      <TabsContent value="scans" className="m-0">
                        <ScansTab 
                          scans={inspectionReport.scans}
                          onChange={(scans) => setInspectionReport({ ...inspectionReport, scans })}
                        />
                      </TabsContent>

                       <TabsContent value="remarks" className="m-0">
                        <RemarksTab 
                          remarks={inspectionReport.remarks}
                          onChange={(remarks) => setInspectionReport({ ...inspectionReport, remarks })}
                        />
                      </TabsContent>
                    </div>
                  </>
                )}
            </div>
          </Tabs>

          {/* 3D Viewer Panel - In floating mode always visible, otherwise only on Setup tab */}
          {(activeTab === "setup" || (typeof localStorage !== 'undefined' && localStorage.getItem('viewer3DFloating') === 'true')) && (
            <div className={localStorage.getItem('viewer3DFloating') === 'true' ? '' : 'hidden lg:block px-4 pb-4'}>
              <Collapsible3DPanel
                title="3D Part Viewer"
                isOpen={viewer3DOpen}
                onToggle={() => setViewer3DOpen(!viewer3DOpen)}
              >
                <ThreeDViewer
                  partType={currentData.inspectionSetup.partType || ""}
                  material={currentData.inspectionSetup.material as MaterialType || ""}
                  dimensions={{
                    length: currentData.inspectionSetup.partLength || 100,
                    width: currentData.inspectionSetup.partWidth || 50,
                    thickness: currentData.inspectionSetup.partThickness || 10,
                    diameter: currentData.inspectionSetup.diameter || 50,
                    isHollow: currentData.inspectionSetup.isHollow,
                    innerDiameter: currentData.inspectionSetup.innerDiameter,
                    innerLength: currentData.inspectionSetup.innerLength,
                    innerWidth: currentData.inspectionSetup.innerWidth,
                    wallThickness: currentData.inspectionSetup.wallThickness,
                    coneTopDiameter: currentData.inspectionSetup.coneTopDiameter,
                    coneBottomDiameter: currentData.inspectionSetup.coneBottomDiameter,
                    coneHeight: currentData.inspectionSetup.coneHeight,
                  }}
                  scanDirections={currentData.scanDetails.scanDetails.map(detail => ({
                    direction: detail.scanningDirection,
                    waveMode: detail.waveMode,
                    isVisible: detail.isVisible || false
                  }))}
                />
              </Collapsible3DPanel>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        completionPercent={completionPercent}
        requiredFieldsComplete={completedFieldsCount}
        totalRequiredFields={reportMode === "Technique" ? 50 : 40}
        autoSaveStatus={autoSaveStatus}
        lastSaved={lastSaved}
      />

      {/* Export Dialog */}
      <UnifiedExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        standard={standard}
        inspectionSetup={isSplitMode && activePart === "B" ? inspectionSetupB : inspectionSetup}
        equipment={isSplitMode && activePart === "B" ? equipmentB : equipment}
        calibration={isSplitMode && activePart === "B" ? calibrationB : calibration}
        scanParameters={isSplitMode && activePart === "B" ? scanParametersB : scanParameters}
        acceptanceCriteria={isSplitMode && activePart === "B" ? acceptanceCriteriaB : acceptanceCriteria}
        documentation={isSplitMode && activePart === "B" ? documentationB : documentation}
        inspectionReport={inspectionReport}
        scanDetails={isSplitMode && activePart === "B" ? scanDetailsB : scanDetails}
        scanPlan={isSplitMode && activePart === "B" ? scanPlanB : scanPlan}
        capturedDrawing={capturedDrawing}
        calibrationBlockDiagram={calibrationBlockDiagram}
        angleBeamDiagram={angleBeamDiagram}
        e2375Diagram={e2375Diagram}
        scanDirectionsDrawing={capturedScanDirections}
        onExport={(format, template) => {
          toast.success(`Exported ${template.toUpperCase()} as ${format.toUpperCase()} successfully!`);
        }}
      />

      {/* Diagnostics Export Dialog */}
      <DiagnosticsExportDialog
        open={diagnosticsDialogOpen}
        onOpenChange={setDiagnosticsDialogOpen}
      />

      {/* Self-Diagnostic Panel */}
      <SelfDiagnosticPanel
        open={diagnosticsPanelOpen}
        onOpenChange={setDiagnosticsPanelOpen}
      />

      {/* Offline Update Dialog (USB) */}
      <OfflineUpdateDialog
        open={offlineUpdateDialogOpen}
        onOpenChange={setOfflineUpdateDialogOpen}
      />

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Card</DialogTitle>
            <DialogDescription>Give your card a clear name so you can find it easily.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="card-name">Card Name</Label>
            <Input
              id="card-name"
              value={sheetNameInput}
              onChange={(event) => setSheetNameInput(event.target.value)}
              placeholder="e.g., AMS-STD-2154E - Part 123"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDialogConfirm} disabled={!sheetNameInput.trim() || isSavingSheet}>
              {isSavingSheet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSavedCardsDialogOpen} onOpenChange={setIsSavedCardsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Saved cards</DialogTitle>
            <DialogDescription>Select a card to continue or manage previously saved work.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {isLoadingSheets ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading saved cards...
              </div>
            ) : savedSheets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No cards saved yet. Use the Save action after naming your project to store your progress.
              </p>
            ) : (
              savedSheets.map((sheet) => (
                <div key={sheet.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold">{sheet.sheetName}</p>
                    <p className="text-xs text-muted-foreground">
                      {(sheet.standard && `Standard: ${sheet.standard}`) || 'Standard not set'} · Updated {new Date(sheet.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {sheet.id === currentSheetId && (
                      <span className="text-xs font-medium text-primary">Current</span>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleLoadSheet(sheet.id)}
                      disabled={loadingSheetId === sheet.id}
                    >
                      {loadingSheetId === sheet.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSheet(sheet.id)}
                      disabled={deletingSheetId === sheet.id}
                    >
                      {deletingSheetId === sheet.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSavedCardsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Button for Block Designer */}
      <FloatingDesignerButton />
    </div>
  );
};

export default Index;
