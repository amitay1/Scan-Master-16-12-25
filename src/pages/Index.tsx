// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StandardSelector } from "@/components/StandardSelector";
import { AcceptanceClassSelector } from "@/components/AcceptanceClassSelector";
import { ThreeDViewer } from "@/components/ThreeDViewer";
import { MenuBar } from "@/components/MenuBar";
import { Toolbar } from "@/components/Toolbar";
import { StatusBar } from "@/components/StatusBar";
import { UnifiedExportDialog } from "@/components/export/UnifiedExportDialog";
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
import { EquipmentDetailsTab } from "@/components/tabs/EquipmentDetailsTab";
import { IndicationsTab } from "@/components/tabs/IndicationsTab";
import { ResultsSummaryTab } from "@/components/tabs/ResultsSummaryTab";
import { InspectorCertificationTab } from "@/components/tabs/InspectorCertificationTab";
import { AerospaceForgingTab } from "@/components/tabs/AerospaceForgingTab";
import { ScanDetailsTab } from "@/components/tabs/ScanDetailsTab";
import { ScanPlanTab } from "@/components/tabs/ScanPlanTab";
import { WebGLLiquidProgress } from "@/components/ui/WebGLLiquidProgress";
import { Collapsible3DPanel } from "@/components/ui/ResizablePanel";
import { CollapsibleSidebar } from "@/components/CollapsibleSidebar";
import { CurrentShapeHeader } from "@/components/CurrentShapeHeader";
import type { StandardType, MaterialType } from "@/types/techniqueSheet";
import { getResolutionValues } from "@/utils/frequencyUtils";
import { useAuth } from "@/hooks/useAuth";
import { logInfo } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import { useInspectorProfile } from "@/contexts/InspectorProfileContext";
import { ProfileSelectionDialog } from "@/components/inspector";
import { testCards } from "@/data/testCards";
import { useLicense } from "@/contexts/LicenseContext";
import { DiagnosticsExportDialog } from "@/components/support/DiagnosticsExportDialog";
import { SelfDiagnosticPanel } from "@/components/diagnostics/SelfDiagnosticPanel";
import { OfflineUpdateDialog } from "@/components/updates/OfflineUpdateDialog";
import { LicenseWarningBanner } from "@/components/LicenseWarningBanner";
import { requiresAngleBeam } from "@/utils/beamTypeClassification";
import { exportInspectionReportPDF } from "@/utils/export/InspectionReportPDF";
import { FloatingDesignerButton } from "@/components/ui/FloatingDesignerButton";
import { StandardProvider } from "@/contexts/StandardContext";

// Custom hooks
import { useTechniqueSheetState } from "@/hooks/useTechniqueSheetState";
import { useSheetPersistence } from "@/hooks/useSheetPersistence";
import { useExportWorkflow } from "@/hooks/useExportWorkflow";
import { useStandardAutoFill } from "@/hooks/useStandardAutoFill";
import { useCompletionScore } from "@/hooks/useCompletionScore";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { isElectron } = useLicense();
  const { needsProfileSelection, isLoading: profileLoading } = useInspectorProfile();

  // ── UI-level state (stays in Index) ────────────────────────────────────
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
  const [viewer3DOpen, setViewer3DOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Hook 1: Technique sheet state ──────────────────────────────────────
  const sheetState = useTechniqueSheetState({
    standard, isSplitMode, activePart, reportMode, activeTab,
    setStandard, setActiveTab, setReportMode, setIsSplitMode, setActivePart,
  });

  const {
    inspectionSetup, setInspectionSetup,
    equipment, setEquipment,
    calibration, setCalibration,
    scanParameters, setScanParameters,
    acceptanceCriteria, setAcceptanceCriteria,
    documentation,
    scanDetails,
    inspectionSetupB, setInspectionSetupB,
    equipmentB, setEquipmentB,
    calibrationB, setCalibrationB,
    scanParametersB, setScanParametersB,
    acceptanceCriteriaB, setAcceptanceCriteriaB,
    documentationB,
    scanDetailsB,
    inspectionReport, setInspectionReport,
    currentData,
    copyPartAToB,
    buildTechniqueSheetPayload,
    buildCardData,
    applyLoadedSheet,
    applyLocalCard,
    loadDraftFromLocalStorage,
    applyTestCard,
    applySampleCard,
    applyStandardChange,
  } = sheetState;

  // ── Hook 4: Standard auto-fill ─────────────────────────────────────────
  useStandardAutoFill({
    standard, isSplitMode, activePart,
    inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria,
    setEquipment, setCalibration: sheetState.setCalibration,
    setScanParameters, setAcceptanceCriteria,
    inspectionSetupB, equipmentB,
    setEquipmentB, setCalibrationB: sheetState.setCalibrationB,
    setScanParametersB, setAcceptanceCriteriaB,
  });

  // ── Hook 5: Completion score ───────────────────────────────────────────
  const { completionPercent, completedFieldsCount } = useCompletionScore({
    currentData, reportMode,
  });

  // ── Hook 2: Sheet persistence ──────────────────────────────────────────
  const persistence = useSheetPersistence({
    user, standard, isSplitMode, activePart, reportMode,
    completionPercent, currentData,
    buildTechniqueSheetPayload, buildCardData,
    applyLoadedSheet, applyLocalCard,
    inspectionSetupB, equipmentB, calibrationB,
    scanParametersB, acceptanceCriteriaB, documentationB,
  });

  // ── Hook 3: Export workflow ────────────────────────────────────────────
  const exportWorkflow = useExportWorkflow({
    activeTab, setActiveTab, reportMode, currentData,
    isSplitMode, activePart, inspectionSetup, inspectionSetupB,
  });

  // ── localStorage draft save ────────────────────────────────────────────
  useEffect(() => {
    const data = {
      standard, isSplitMode, activePart,
      inspectionSetup: sheetState.inspectionSetup,
      equipment: sheetState.equipment,
      calibration: sheetState.calibration,
      scanParameters: sheetState.scanParameters,
      acceptanceCriteria: sheetState.acceptanceCriteria,
      documentation: sheetState.documentation,
      scanDetails: sheetState.scanDetails,
      inspectionSetupB: sheetState.inspectionSetupB,
      equipmentB: sheetState.equipmentB,
      calibrationB: sheetState.calibrationB,
      scanParametersB: sheetState.scanParametersB,
      acceptanceCriteriaB: sheetState.acceptanceCriteriaB,
      documentationB: sheetState.documentationB,
      scanDetailsB: sheetState.scanDetailsB,
    };
    localStorage.setItem("techniqueSheet_draft", JSON.stringify(data));
  }, [
    standard, isSplitMode, activePart,
    sheetState.inspectionSetup, sheetState.equipment, sheetState.calibration,
    sheetState.scanParameters, sheetState.acceptanceCriteria, sheetState.documentation, sheetState.scanDetails,
    sheetState.inspectionSetupB, sheetState.equipmentB, sheetState.calibrationB,
    sheetState.scanParametersB, sheetState.acceptanceCriteriaB, sheetState.documentationB, sheetState.scanDetailsB,
  ]);

  // Load draft on mount
  useEffect(() => {
    loadDraftFromLocalStorage();
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "s":
            e.preventDefault();
            persistence.handleSave();
            break;
          case "e":
            e.preventDefault();
            setExportDialogOpen(true);
            break;
          case "n":
            e.preventDefault();
            handleNewProject();
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [persistence.handleSave]);

  const handleNewProject = useCallback(() => {
    if (confirm("Start a new project? Unsaved changes will be lost.")) {
      persistence.setCurrentLocalCardId(null);
      persistence.setCurrentSheetName("");
      window.location.reload();
    }
  }, []);

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

  const loadTestCard = useCallback((cardIndex: number) => {
    const card = testCards[cardIndex - 1];
    if (!card) {
      toast.error(`Test card ${cardIndex} not found`);
      return;
    }
    applyTestCard(card);
    toast.success(`Loaded test card: ${card.name}`);
    logInfo("Loaded test card", { cardId: card.id, cardName: card.name });
  }, [applyTestCard]);

  const handleLoadSampleCards = useCallback(async () => {
    try {
      const response = await fetch("/sample-cards.json");
      if (!response.ok) throw new Error("Failed to fetch sample cards");
      const cards = await response.json();
      if (Array.isArray(cards) && cards.length > 0) {
        applySampleCard(cards[0]);
        toast.success(`Loaded sample card: ${cards[0].name}`, {
          description: `${cards.length} sample cards available. Use Ctrl+Shift+1/2/3 to load others.`,
        });
        logInfo("Loaded sample card", { cardName: cards[0].name });
      } else {
        toast.error("No sample cards found");
      }
    } catch (error) {
      console.error("Error loading sample cards:", error);
      toast.error("Failed to load sample cards");
    }
  }, [applySampleCard]);

  // Keyboard shortcuts for test cards
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        if (e.key === "1") { e.preventDefault(); loadTestCard(1); }
        else if (e.key === "2") { e.preventDefault(); loadTestCard(2); }
        else if (e.key === "3") { e.preventDefault(); loadTestCard(3); }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loadTestCard]);

  // Redirect to auth page if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleExportPDF = useCallback(async () => {
    const result = await exportWorkflow.handleExportPDF();
    if (result.shouldOpenDialog) {
      setExportDialogOpen(true);
    }
  }, [exportWorkflow.handleExportPDF]);

  // ── Loading / auth guards ──────────────────────────────────────────────
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
    <StandardProvider standard={standard}>
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

      {/* Menu Bar - Hidden on Mobile and in Electron */}
      {!isElectron && (
        <div className="hidden md:block">
          <MenuBar
            onSave={persistence.handleSave}
            onOpenSavedCards={persistence.handleOpenSavedCards}
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
        onSave={persistence.handleSave}
        onExport={() => setExportDialogOpen(true)}
        onValidate={handleValidate}
        reportMode={reportMode}
        onReportModeChange={setReportMode}
        isSplitMode={isSplitMode}
        onSplitModeChange={setIsSplitMode}
        activePart={activePart}
        onActivePartChange={setActivePart}
        onCopyAToB={copyPartAToB}
        onOpenSavedCards={persistence.handleOpenSavedCards}
        onLoadLocalCard={persistence.handleLoadLocalCard}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Mobile: Compact Header with Standard & Class */}
        <div className="md:hidden border-b border-border bg-card p-3">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-xs mb-2">Standard</h3>
              <StandardSelector value={standard} onChange={applyStandardChange} />
            </div>
            {reportMode === "Technique" && (
              <div className="border-t border-border pt-3">
                <AcceptanceClassSelector
                  value={(!isSplitMode || activePart === "A") ? acceptanceCriteria.acceptanceClass : acceptanceCriteriaB.acceptanceClass}
                  onChange={(newClass) => {
                    if (!isSplitMode || activePart === "A") {
                      setAcceptanceCriteria(prev => ({ ...prev, acceptanceClass: newClass }));
                    } else {
                      setAcceptanceCriteriaB(prev => ({ ...prev, acceptanceClass: newClass }));
                    }
                  }}
                  standard={standard}
                />
              </div>
            )}
          </div>
        </div>

        {/* Desktop: Left Panel with Standard Selector */}
        <CollapsibleSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          title="Standard & Class"
        >
          <StandardSelector value={standard} onChange={applyStandardChange} />
          {reportMode === "Technique" && (
            <div className="mt-6 pt-4 border-t border-border">
              <AcceptanceClassSelector
                value={(!isSplitMode || activePart === "A") ? acceptanceCriteria.acceptanceClass : acceptanceCriteriaB.acceptanceClass}
                onChange={(newClass) => {
                  if (!isSplitMode || activePart === "A") {
                    setAcceptanceCriteria(prev => ({ ...prev, acceptanceClass: newClass }));
                  } else {
                    setAcceptanceCriteriaB(prev => ({ ...prev, acceptanceClass: newClass }));
                  }
                }}
                standard={standard}
              />
            </div>
          )}
        </CollapsibleSidebar>

        {/* Center Panel: Main Form */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-2 md:p-4 flex-shrink-0">
                {reportMode === "Technique" ? (
                  <>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <CurrentShapeHeader partType={currentData.inspectionSetup.partType} className="flex-shrink-0 max-w-[180px]" />
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
                        <TabsTrigger value="calibration" className="flex-shrink-0 px-3 whitespace-nowrap">Reference Standard</TabsTrigger>
                        <TabsTrigger value="acceptance" className="flex-shrink-0 px-3">Acceptance</TabsTrigger>
                        <TabsTrigger value="scandetails" className="flex-shrink-0 px-3 whitespace-nowrap">Scan Details</TabsTrigger>
                        <TabsTrigger value="docs" className="flex-shrink-0 px-3">Documentation</TabsTrigger>
                        <TabsTrigger value="scanplan" className="flex-shrink-0 px-3 whitespace-nowrap">Scan Plan</TabsTrigger>
                      </TabsList>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <WebGLLiquidProgress
                          value={completionPercent}
                          completedFields={completedFieldsCount}
                          totalFields={40}
                        />
                      </div>
                      <Button
                        onClick={() => {
                          toast.loading("Generating Inspection Report PDF...", { id: "report-export" });
                          setTimeout(() => {
                            exportInspectionReportPDF(inspectionReport, {
                              companyName: "SCAN-MASTER",
                              includeAerospaceSection: true,
                            });
                            toast.dismiss("report-export");
                            toast.success("Inspection Report PDF exported successfully!");
                          }, 500);
                        }}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Export Report PDF
                      </Button>
                    </div>
                    <div className="w-full overflow-x-auto scrollbar-hide md:overflow-visible sticky top-0 bg-background z-10 pb-2">
                      <TabsList className="inline-flex flex-nowrap h-10 items-center justify-start md:justify-center rounded-md bg-muted p-1 text-muted-foreground w-max md:w-full">
                        <TabsTrigger value="cover" className="flex-shrink-0 px-3 whitespace-nowrap">Cover Page</TabsTrigger>
                        <TabsTrigger value="equipment-report" className="flex-shrink-0 px-3 whitespace-nowrap">Equipment</TabsTrigger>
                        <TabsTrigger value="diagram" className="flex-shrink-0 px-3 whitespace-nowrap">Part Diagram</TabsTrigger>
                        <TabsTrigger value="indications" className="flex-shrink-0 px-3 whitespace-nowrap">Indications</TabsTrigger>
                        <TabsTrigger value="probe" className="flex-shrink-0 px-3 whitespace-nowrap">Probes</TabsTrigger>
                        <TabsTrigger value="scans" className="flex-shrink-0 px-3">Scans</TabsTrigger>
                        <TabsTrigger value="results" className="flex-shrink-0 px-3 whitespace-nowrap">Results</TabsTrigger>
                        <TabsTrigger value="certification" className="flex-shrink-0 px-3 whitespace-nowrap">Certification</TabsTrigger>
                        <TabsTrigger value="aerospace" className="flex-shrink-0 px-3 whitespace-nowrap">Aerospace</TabsTrigger>
                        <TabsTrigger value="remarks" className="flex-shrink-0 px-3">Remarks</TabsTrigger>
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
                          standardType={standard}
                          scanDetails={currentData.scanDetails}
                          onCalibrationRecommendation={(blockType, reasoning) => {
                            const currentCalibration = currentData.calibration;
                            if (currentCalibration.standardType !== blockType) {
                              currentData.setCalibration({
                                ...currentCalibration,
                                standardType: blockType as any,
                                autoRecommendedReason: reasoning,
                              });
                              logInfo(`Auto-selected calibration block: ${blockType}`, {
                                reasoning,
                                criticalScans: {
                                  hasCircumferential: currentData.scanDetails.scanDetails.some(s => s.enabled && ["D", "E"].includes(s.scanningDirection)),
                                  hasAngleBeam: currentData.scanDetails.scanDetails.some(s => s.enabled && ["F", "G", "H"].includes(s.scanningDirection)),
                                },
                              });
                            }
                          }}
                        />
                      </TabsContent>

                      <TabsContent value="scandetails" className="m-0">
                        <ScanDetailsTab
                          data={currentData.scanDetails}
                          onChange={currentData.setScanDetails}
                          partType={currentData.inspectionSetup.partType}
                          standard={standard}
                          dimensions={{
                            diameter: currentData.inspectionSetup.diameter,
                            length: currentData.inspectionSetup.partLength,
                            width: currentData.inspectionSetup.partWidth,
                            height: currentData.inspectionSetup.partThickness,
                            thickness: currentData.inspectionSetup.partThickness,
                            outerDiameter: currentData.inspectionSetup.diameter,
                            innerDiameter: currentData.inspectionSetup.innerDiameter,
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
                          equipmentFrequency={currentData.equipment.frequency}
                          onEquipmentFrequencyChange={(frequency) => {
                            const resolution = getResolutionValues(frequency);
                            currentData.setEquipment({
                              ...currentData.equipment,
                              frequency,
                              entrySurfaceResolution: resolution.entry,
                              backSurfaceResolution: resolution.back,
                            });
                          }}
                          equipmentData={currentData.equipment}
                          onEquipmentDataChange={currentData.setEquipment}
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

                      <TabsContent value="equipment-report" className="m-0">
                        <EquipmentDetailsTab
                          data={inspectionReport.equipmentDetails}
                          onChange={(equipmentDetails) => setInspectionReport({ ...inspectionReport, equipmentDetails })}
                        />
                      </TabsContent>

                      <TabsContent value="diagram" className="m-0">
                        <PartDiagramTab
                          partDiagramImage={inspectionReport.partDiagramImage}
                          onChange={(image) => setInspectionReport({ ...inspectionReport, partDiagramImage: image })}
                          standardType={standard}
                          partNumber={inspectionSetup.partNumber}
                          partType={inspectionSetup.partType}
                          thickness={inspectionSetup.partThickness.toString()}
                          diameter={inspectionSetup.diameter?.toString()}
                          length={inspectionSetup.partLength.toString()}
                        />
                      </TabsContent>

                      <TabsContent value="indications" className="m-0">
                        <IndicationsTab
                          indications={inspectionReport.indications}
                          onChange={(indications) => setInspectionReport({ ...inspectionReport, indications })}
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

                      <TabsContent value="results" className="m-0">
                        <ResultsSummaryTab
                          resultsSummary={inspectionReport.resultsSummary}
                          applicableDocuments={inspectionReport.applicableDocuments}
                          onResultsChange={(resultsSummary) => setInspectionReport({ ...inspectionReport, resultsSummary })}
                          onDocumentsChange={(applicableDocuments) => setInspectionReport({ ...inspectionReport, applicableDocuments })}
                        />
                      </TabsContent>

                      <TabsContent value="certification" className="m-0">
                        <InspectorCertificationTab
                          inspectorCertification={inspectionReport.inspectorCertification}
                          signatures={inspectionReport.signatures}
                          onCertificationChange={(inspectorCertification) => setInspectionReport({ ...inspectionReport, inspectorCertification })}
                          onSignaturesChange={(signatures) => setInspectionReport({ ...inspectionReport, signatures })}
                        />
                      </TabsContent>

                      <TabsContent value="aerospace" className="m-0">
                        <AerospaceForgingTab
                          testLocationTiming={inspectionReport.testLocationTiming}
                          environmentalConditions={inspectionReport.environmentalConditions}
                          couplantDetails={inspectionReport.couplantDetails}
                          forgingDetails={inspectionReport.forgingDetails}
                          sensitivitySettings={inspectionReport.sensitivitySettings}
                          transferCorrection={inspectionReport.transferCorrection}
                          bweMonitoring={inspectionReport.bweMonitoring}
                          scanCoverage={inspectionReport.scanCoverage}
                          zoningRequirements={inspectionReport.zoningRequirements}
                          onTestLocationChange={(testLocationTiming) => setInspectionReport({ ...inspectionReport, testLocationTiming })}
                          onEnvironmentalChange={(environmentalConditions) => setInspectionReport({ ...inspectionReport, environmentalConditions })}
                          onCouplantChange={(couplantDetails) => setInspectionReport({ ...inspectionReport, couplantDetails })}
                          onForgingChange={(forgingDetails) => setInspectionReport({ ...inspectionReport, forgingDetails })}
                          onSensitivityChange={(sensitivitySettings) => setInspectionReport({ ...inspectionReport, sensitivitySettings })}
                          onTransferChange={(transferCorrection) => setInspectionReport({ ...inspectionReport, transferCorrection })}
                          onBweChange={(bweMonitoring) => setInspectionReport({ ...inspectionReport, bweMonitoring })}
                          onScanCoverageChange={(scanCoverage) => setInspectionReport({ ...inspectionReport, scanCoverage })}
                          onZoningChange={(zoningRequirements) => setInspectionReport({ ...inspectionReport, zoningRequirements })}
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

          {/* 3D Viewer Panel */}
          {(activeTab === "setup" || (typeof localStorage !== "undefined" && localStorage.getItem("viewer3DFloating") === "true")) && (
            <div className={localStorage.getItem("viewer3DFloating") === "true" ? "" : "hidden lg:block px-4 pb-4"}>
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
        autoSaveStatus={persistence.autoSaveStatus}
        lastSaved={persistence.lastSaved}
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
        scanPlan={isSplitMode && activePart === "B" ? sheetState.scanPlanB : sheetState.scanPlan}
        capturedDrawing={exportWorkflow.capturedDrawing}
        calibrationBlockDiagram={exportWorkflow.calibrationBlockDiagram}
        angleBeamDiagram={
          requiresAngleBeam(
            isSplitMode && activePart === "B" ? inspectionSetupB.partType : inspectionSetup.partType,
            isSplitMode && activePart === "B" ? inspectionSetupB.isHollow : inspectionSetup.isHollow,
          ) ? exportWorkflow.angleBeamDiagram : undefined
        }
        e2375Diagram={exportWorkflow.e2375Diagram}
        scanDirectionsDrawing={exportWorkflow.capturedScanDirections}
        reportMode={reportMode}
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

      <Dialog open={persistence.isSaveDialogOpen} onOpenChange={persistence.setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Card</DialogTitle>
            <DialogDescription>Give your card a clear name so you can find it easily.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="card-name">Card Name</Label>
            <Input
              id="card-name"
              value={persistence.sheetNameInput}
              onChange={(event) => persistence.setSheetNameInput(event.target.value)}
              placeholder="e.g., AMS-STD-2154E - Part 123"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => persistence.setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={persistence.handleSaveDialogConfirm} disabled={!persistence.sheetNameInput.trim() || persistence.isSavingSheet}>
              {persistence.isSavingSheet && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={persistence.isSavedCardsDialogOpen} onOpenChange={persistence.setIsSavedCardsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Saved cards</DialogTitle>
            <DialogDescription>Select a card to continue or manage previously saved work.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {persistence.isLoadingSheets ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading saved cards...
              </div>
            ) : persistence.savedSheets.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No cards saved yet. Use the Save action after naming your project to store your progress.
              </p>
            ) : (
              persistence.savedSheets.map((sheet) => (
                <div key={sheet.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card/60 p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold">{sheet.sheetName}</p>
                    <p className="text-xs text-muted-foreground">
                      {(sheet.standard && `Standard: ${sheet.standard}`) || "Standard not set"} · Updated {new Date(sheet.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {sheet.id === persistence.currentSheetId && (
                      <span className="text-xs font-medium text-primary">Current</span>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => persistence.handleLoadSheet(sheet.id)}
                      disabled={persistence.loadingSheetId === sheet.id}
                    >
                      {persistence.loadingSheetId === sheet.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => persistence.handleDeleteSheet(sheet.id)}
                      disabled={persistence.deletingSheetId === sheet.id}
                    >
                      {persistence.deletingSheetId === sheet.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => persistence.setIsSavedCardsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Button for Block Designer */}
      <FloatingDesignerButton />

      </div>
    </StandardProvider>
  );
};

export default Index;
