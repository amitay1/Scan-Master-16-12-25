import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StandardSelector } from "@/components/StandardSelector";
import { ThreeDViewer } from "@/components/ThreeDViewer";
import { MenuBar } from "@/components/MenuBar";
import { Toolbar } from "@/components/Toolbar";
import { StatusBar } from "@/components/StatusBar";
import { ExportDialog } from "@/components/export/ExportDialog";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { ScanDetailsTab, ScanDetailsData } from "@/components/tabs/ScanDetailsTab";
import { TechnicalDrawingTab } from "@/components/tabs/TechnicalDrawingTab";
import { LiquidProgressGauge } from "@/components/ui/liquid-progress-gauge";
import {
  StandardType, 
  InspectionSetupData, 
  EquipmentData, 
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  DocumentationData,
  MaterialType
} from "@/types/techniqueSheet";
import { InspectionReportData } from "@/types/inspectionReport";
import { standardRules, getRecommendedFrequency, getCouplantRecommendation, calculateMetalTravel } from "@/utils/autoFillLogic";
import { exportTechniqueSheetToPDF } from "@/utils/techniqueSheetExport";
import { exportInspectionReportToPDF } from "@/utils/inspectionReportExport";
import { useAuth } from "@/hooks/useAuth";
import { logError, logInfo } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { fieldDependencyEngine } from "@/utils/standards/fieldDependencyEngine";
import { validationEngine } from "@/utils/standards/validationEngine";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [standard, setStandard] = useState<StandardType>("AMS-STD-2154E");
  const [activeTab, setActiveTab] = useState("setup");
  const [reportMode, setReportMode] = useState<"Technique" | "Report">("Technique");
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [activePart, setActivePart] = useState<"A" | "B">("A");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [capturedDrawing, setCapturedDrawing] = useState<string | undefined>();
  
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

  // Get current data based on active part
  const getCurrentData = () => {
    if (!isSplitMode || activePart === "A") {
      return {
        inspectionSetup,
        equipment,
        calibration,
        scanParameters,
        acceptanceCriteria,
        documentation,
        scanDetails,
        setInspectionSetup,
        setEquipment,
        setCalibration,
        setScanParameters,
        setAcceptanceCriteria,
        setDocumentation,
        setScanDetails,
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
        setInspectionSetup: setInspectionSetupB,
        setEquipment: setEquipmentB,
        setCalibration: setCalibrationB,
        setScanParameters: setScanParametersB,
        setAcceptanceCriteria: setAcceptanceCriteriaB,
        setDocumentation: setDocumentationB,
        setScanDetails: setScanDetailsB,
      };
    }
  };

  const currentData = getCurrentData();

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
            handleExportPDF();
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

  // Calculate completion
  const calculateCompletion = () => {
    let completed = 0;
    let total = 35;

    if (currentData.inspectionSetup.partNumber) completed++;
    if (currentData.inspectionSetup.partName) completed++;
    if (currentData.inspectionSetup.material) completed++;
    if (currentData.inspectionSetup.materialSpec) completed++;
    if (currentData.inspectionSetup.partType) completed++;
    if (currentData.inspectionSetup.partThickness >= 6.35) completed++;
    
    if (currentData.equipment.manufacturer) completed++;
    if (currentData.equipment.model) completed++;
    if (currentData.equipment.frequency) completed++;
    if (currentData.equipment.transducerType) completed++;
    if (currentData.equipment.couplant) completed++;
    if (currentData.equipment.verticalLinearity) completed++;
    if (currentData.equipment.horizontalLinearity) completed++;
    if (currentData.equipment.transducerDiameter) completed++;

    if (currentData.calibration.standardType) completed++;
    if (currentData.calibration.referenceMaterial) completed++;
    if (currentData.calibration.fbhSizes) completed++;
    if (currentData.calibration.metalTravelDistance) completed++;

    if (currentData.scanParameters.scanMethod) completed++;
    if (currentData.scanParameters.scanType) completed++;
    if (currentData.scanParameters.scanSpeed) completed++;
    if (currentData.scanParameters.scanIndex) completed++;
    if (currentData.scanParameters.coverage) completed++;
    if (currentData.scanParameters.scanPattern) completed++;

    if (currentData.acceptanceCriteria.acceptanceClass) completed++;
    if (currentData.acceptanceCriteria.singleDiscontinuity) completed++;
    if (currentData.acceptanceCriteria.multipleDiscontinuities) completed++;
    if (currentData.acceptanceCriteria.linearDiscontinuity) completed++;
    if (currentData.acceptanceCriteria.backReflectionLoss) completed++;
    if (currentData.acceptanceCriteria.noiseLevel) completed++;

    if (currentData.documentation.inspectorName) completed++;
    if (currentData.documentation.inspectorCertification) completed++;
    if (documentation.inspectorLevel) completed++;
    if (documentation.inspectionDate) completed++;
    if (documentation.revision) completed++;

    return (completed / total) * 100;
  };

  const handleNewProject = () => {
    if (confirm('Start a new project? Unsaved changes will be lost.')) {
      window.location.reload();
    }
  };

  const handleSave = async () => {
    try {
      // Validate technique sheet data before saving
      const { validateTechniqueSheetData } = await import('@/lib/inputValidation');
      
      const techniqueData = {
        standardName: standard,
        inspectionSetup: currentData.inspectionSetup,
        equipment: currentData.equipment,
        calibration: currentData.calibration,
        scanParameters: currentData.scanParameters,
        acceptanceCriteria: currentData.acceptanceCriteria,
        documentation: currentData.documentation,
        scanDetails: currentData.scanDetails,
      };

      const validation = validateTechniqueSheetData(techniqueData);
      if (!validation.valid) {
        toast.error(`Validation failed: ${validation.error}`);
        return;
      }

      toast.success("Technique sheet validated and saved successfully!");
    } catch (error) {
      console.error('Error saving technique sheet:', error);
      toast.error('Error saving technique sheet');
    }
  };

  const handleExportPDF = () => {
    if (reportMode === "Technique") {
      // Function to capture drawing after ensuring canvas is rendered
      const captureAndExport = () => {
        // Small delay to ensure canvas is fully rendered
        setTimeout(() => {
          const canvas = document.getElementById('technical-drawing-canvas') as HTMLCanvasElement;
          if (!canvas) {
            toast.error('Failed to render technical drawing. Please try again.');
            // DO NOT open export dialog - block export
            return;
          }
          
          try {
            const drawingImage = canvas.toDataURL('image/png');
            if (!drawingImage || drawingImage.length <= 100) {
              toast.error('Technical drawing is empty. Please ensure the drawing has rendered before exporting.');
              // DO NOT open export dialog - block export
              return;
            }
            
            // SUCCESS - drawing captured
            setCapturedDrawing(drawingImage);
            setExportDialogOpen(true);
            
          } catch (error) {
            console.error('Failed to capture technical drawing:', error);
            toast.error('Failed to capture technical drawing. Please try again or contact support.');
            // DO NOT open export dialog - block export
            return;
          }
        }, 300); // 300ms delay for canvas rendering
      };
      
      // Check if we're already on the technical drawing tab
      if (activeTab === 'drawing') {
        // Already on the tab, capture immediately
        captureAndExport();
      } else {
        // Switch to technical drawing tab first
        setActiveTab('drawing');
        // Capture after tab switch completes
        captureAndExport();
      }
    } else {
      // For inspection reports, use the existing export function
      try {
        exportInspectionReportToPDF(
          inspectionReport,
          inspectionSetup.partNumber || '',
          documentation.drawingReference || '',
          documentation.inspectionDate || new Date().toISOString().split('T')[0],
          documentation.inspectorName || '',
          documentation.procedureNumber || '',
          `Class: ${acceptanceCriteria.acceptanceClass}, Single: ${acceptanceCriteria.singleDiscontinuity}, Multiple: ${acceptanceCriteria.multipleDiscontinuities}`
        );
        toast.success("Inspection Report PDF exported successfully!");
      } catch (error) {
        console.error("Failed to export PDF:", error);
        toast.error("Failed to export PDF. Please try again.");
      }
    }
  };

  const handleValidate = () => {
    const missing = [];
    if (!inspectionSetup.partNumber) missing.push("Part Number");
    if (!equipment.manufacturer) missing.push("Equipment Manufacturer");
    if (!calibration.standardType) missing.push("Calibration Standard");
    if (!acceptanceCriteria.acceptanceClass) missing.push("Acceptance Class");
    if (!documentation.inspectorName) missing.push("Inspector Name");

    if (missing.length > 0) {
      toast.error(`Missing required fields: ${missing.join(", ")}`);
    } else {
      toast.success("All required fields complete! ✓");
    }
  };

  // Redirect to auth page if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
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
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Menu Bar - Hidden on Mobile */}
      <div className="hidden md:block">
        <MenuBar 
          onSave={handleSave}
          onExport={handleExportPDF}
          onNew={handleNewProject}
          onSignOut={signOut}
        />
      </div>

      {/* Toolbar */}
      <Toolbar
        onSave={handleSave}
        onExport={handleExportPDF}
        onValidate={handleValidate}
        reportMode={reportMode}
        onReportModeChange={setReportMode}
        isSplitMode={isSplitMode}
        onSplitModeChange={setIsSplitMode}
        activePart={activePart}
        onActivePartChange={setActivePart}
        onCopyAToB={copyPartAToB}
      />

      {/* Main Content Area - Responsive Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Mobile: Compact Header with Standard and Completion */}
        <div className="md:hidden border-b border-border bg-card p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-xs mb-2">Standard</h3>
              <StandardSelector 
                value={standard} 
                onChange={setStandard} 
              />
            </div>
            <div className="flex flex-col items-center">
              <LiquidProgressGauge value={calculateCompletion()} />
              <div className="text-xs text-muted-foreground mt-1">Complete</div>
            </div>
          </div>
        </div>

        {/* Desktop: Left Panel with Standard Selector */}
        <div className="hidden md:block md:w-[15%] md:min-w-[200px] md:max-w-[250px]">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={100}>
              <div className="h-full app-panel flex flex-col">
                <div className="p-3 border-b border-border">
                  <h3 className="font-semibold text-sm mb-3">Standard</h3>
                  <StandardSelector 
                    value={standard} 
                    onChange={setStandard} 
                  />
                </div>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">COMPLETION</h4>
                      <div className="flex flex-col items-center">
                        <LiquidProgressGauge value={calculateCompletion()} />
                        <div className="text-xs text-muted-foreground mt-2">
                          {(() => {
                            const completion = calculateCompletion();
                            const totalFields = reportMode === "Technique" ? 50 : 40;
                            return Math.round((completion / 100) * totalFields);
                          })()}/{reportMode === "Technique" ? 50 : 40} fields
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
          </ResizablePanelGroup>
        </div>

        {/* Center Panel: Main Form - Full width on mobile */}
        <div className="flex-1 overflow-auto">
          <div className="h-full">
            <div className="p-2 md:p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {reportMode === "Technique" ? (
                  <>
                    <div className="w-full overflow-x-auto scrollbar-hide md:overflow-visible">
                      <TabsList className="inline-flex flex-nowrap h-10 items-center justify-start md:justify-center rounded-md bg-muted p-1 text-muted-foreground w-max md:w-full">
                        <TabsTrigger value="setup" className="flex-shrink-0 px-3 text-xs md:text-sm">Setup</TabsTrigger>
                        <TabsTrigger value="scandetails" className="flex-shrink-0 px-3 text-xs md:text-sm whitespace-nowrap">Scan Details</TabsTrigger>
                        <TabsTrigger value="drawing" className="flex-shrink-0 px-3 text-xs md:text-sm whitespace-nowrap">Technical Drawing</TabsTrigger>
                        <TabsTrigger value="equipment" className="flex-shrink-0 px-3 text-xs md:text-sm">Equipment</TabsTrigger>
                        <TabsTrigger value="calibration" className="flex-shrink-0 px-3 text-xs md:text-sm whitespace-nowrap">Reference Standard</TabsTrigger>
                        <TabsTrigger value="scan" className="flex-shrink-0 px-3 text-xs md:text-sm whitespace-nowrap">Scan Params</TabsTrigger>
                        <TabsTrigger value="acceptance" className="flex-shrink-0 px-3 text-xs md:text-sm">Acceptance</TabsTrigger>
                        <TabsTrigger value="docs" className="flex-shrink-0 px-3 text-xs md:text-sm">Documentation</TabsTrigger>
                      </TabsList>
                    </div>

                    <div className="mt-4 app-panel rounded-md">
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
                        />
                      </TabsContent>

                      <TabsContent value="drawing" className="m-0">
                        {currentData.inspectionSetup.partType ? (
                          <TechnicalDrawingTab
                            partType={currentData.inspectionSetup.partType}
                            dimensions={{
                              length: currentData.inspectionSetup.partLength || 100,
                              width: currentData.inspectionSetup.partWidth || 50,
                              thickness: currentData.inspectionSetup.partThickness || 10,
                              diameter: currentData.inspectionSetup.diameter || undefined,
                              isHollow: currentData.inspectionSetup.isHollow,
                              innerDiameter: currentData.inspectionSetup.innerDiameter,
                              innerLength: currentData.inspectionSetup.innerLength,
                              innerWidth: currentData.inspectionSetup.innerWidth,
                              wallThickness: currentData.inspectionSetup.wallThickness,
                            }}
                            material={currentData.inspectionSetup.material as MaterialType}
                          />
                        ) : (
                          <div className="p-6 text-center">
                            <p className="text-muted-foreground">
                              Please select a part type in the Setup tab to view the technical drawing.
                            </p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="equipment" className="m-0">
                        <EquipmentTab 
                          data={currentData.equipment}
                          onChange={currentData.setEquipment}
                          partThickness={currentData.inspectionSetup.partThickness}
                        />
                      </TabsContent>

                      <TabsContent value="calibration" className="m-0">
                        <CalibrationTab
                          data={currentData.calibration}
                          onChange={currentData.setCalibration}
                          inspectionSetup={currentData.inspectionSetup}
                          acceptanceClass={currentData.acceptanceCriteria.acceptanceClass}
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
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full overflow-x-auto scrollbar-hide md:overflow-visible">
                      <TabsList className="inline-flex flex-nowrap h-10 items-center justify-start md:justify-center rounded-md bg-muted p-1 text-muted-foreground w-max md:w-full">
                        <TabsTrigger value="cover" className="flex-shrink-0 px-4 text-xs md:text-sm whitespace-nowrap">Cover Page</TabsTrigger>
                        <TabsTrigger value="diagram" className="flex-shrink-0 px-4 text-xs md:text-sm whitespace-nowrap">Part Diagram</TabsTrigger>
                        <TabsTrigger value="probe" className="flex-shrink-0 px-4 text-xs md:text-sm whitespace-nowrap">Probe Details</TabsTrigger>
                        <TabsTrigger value="scans" className="flex-shrink-0 px-4 text-xs md:text-sm">Scans</TabsTrigger>
                        <TabsTrigger value="remarks" className="flex-shrink-0 px-4 text-xs md:text-sm">Remarks</TabsTrigger>
                      </TabsList>
                    </div>

                    <div className="mt-4 app-panel rounded-md">
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
              </Tabs>
            </div>
          </div>
        </div>

        {/* Desktop: Right Panel - 3D Viewer */}
        <div className="hidden lg:block lg:w-[30%] lg:min-w-[300px] lg:max-w-[450px]">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={100}>
              <div className="h-full app-panel">
                <div className="p-3 border-b border-border">
                  <h3 className="font-semibold text-sm">3D Part Viewer</h3>
                </div>
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
                  }}
                  scanDirections={currentData.scanDetails.scanDetails.map(detail => ({
                    direction: detail.scanningDirection,
                    waveMode: detail.waveMode,
                    isVisible: detail.isVisible || false
                  }))}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        completionPercent={calculateCompletion()}
        requiredFieldsComplete={(() => {
          const completion = calculateCompletion();
          const totalFields = reportMode === "Technique" ? 50 : 40;
          return Math.round((completion / 100) * totalFields);
        })()}
        totalRequiredFields={reportMode === "Technique" ? 50 : 40}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        partDiagram={capturedDrawing}
        data={{
          standard,
          inspectionSetup: isSplitMode && activePart === "B" ? inspectionSetupB : inspectionSetup,
          equipment: isSplitMode && activePart === "B" ? equipmentB : equipment,
          calibration: isSplitMode && activePart === "B" ? calibrationB : calibration,
          scanParameters: isSplitMode && activePart === "B" ? scanParametersB : scanParameters,
          acceptanceCriteria: isSplitMode && activePart === "B" ? acceptanceCriteriaB : acceptanceCriteria,
          documentation: isSplitMode && activePart === "B" ? documentationB : documentation,
        }}
      />
    </div>
  );
};

export default Index;
