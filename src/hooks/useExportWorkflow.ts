import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { useExportCaptures } from "@/hooks/useExportCaptures";
import { requiresAngleBeam } from "@/utils/beamTypeClassification";
import type { CurrentPartData } from "@/hooks/useTechniqueSheetState";
import type { InspectionSetupData } from "@/types/techniqueSheet";

interface UseExportWorkflowParams {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  reportMode: "Technique" | "Report";
  currentData: CurrentPartData;
  isSplitMode: boolean;
  activePart: "A" | "B";
  inspectionSetup: InspectionSetupData;
  inspectionSetupB: InspectionSetupData;
}

export function useExportWorkflow({
  activeTab,
  setActiveTab,
  reportMode,
  currentData,
  isSplitMode,
  activePart,
  inspectionSetup,
  inspectionSetupB,
}: UseExportWorkflowParams) {
  // Capture state
  const [capturedDrawing, setCapturedDrawing] = useState<string | undefined>();
  const [calibrationBlockDiagram, setCalibrationBlockDiagram] = useState<string | undefined>();
  const [capturedScanDirections, setCapturedScanDirections] = useState<string | undefined>();
  const [angleBeamDiagram, setAngleBeamDiagram] = useState<string | undefined>();
  const [e2375Diagram, setE2375Diagram] = useState<string | undefined>();

  const {
    captures: exportCaptures,
    captureTechnicalDrawing,
    captureCalibrationBlock,
    captureAngleBeamBlock,
    captureE2375Diagram: captureE2375DiagramFn,
    captureScanDirections,
    isCapturing: isCaptureInProgress,
  } = useExportCaptures();

  // ── Auto-capture technical drawing on setup tab ────────────────────────
  useEffect(() => {
    if (activeTab === "setup" && reportMode === "Technique") {
      const timer = setTimeout(async () => {
        const success = await captureTechnicalDrawing();
        if (success && exportCaptures.technicalDrawing) {
          setCapturedDrawing(exportCaptures.technicalDrawing);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [activeTab, reportMode, captureTechnicalDrawing, exportCaptures.technicalDrawing]);

  // ── Auto-capture calibration block on calibration tab ──────────────────
  useEffect(() => {
    if (activeTab === "calibration" && reportMode === "Technique") {
      const timer = setTimeout(async () => {
        const success = await captureCalibrationBlock();
        if (success && exportCaptures.calibrationBlockDiagram) {
          setCalibrationBlockDiagram(exportCaptures.calibrationBlockDiagram);
        }
        const currentPartType = isSplitMode && activePart === "B" ? inspectionSetupB.partType : inspectionSetup.partType;
        const currentIsHollow = isSplitMode && activePart === "B" ? inspectionSetupB.isHollow : inspectionSetup.isHollow;
        const partNeedsAngleBeam = requiresAngleBeam(currentPartType, currentIsHollow);
        if (partNeedsAngleBeam) {
          const angleSuccess = await captureAngleBeamBlock();
          if (angleSuccess && exportCaptures.angleBeamCalibrationDiagram) {
            setAngleBeamDiagram(exportCaptures.angleBeamCalibrationDiagram);
          }
        } else {
          setAngleBeamDiagram(undefined);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    activeTab, reportMode, captureCalibrationBlock, captureAngleBeamBlock,
    exportCaptures.calibrationBlockDiagram, exportCaptures.angleBeamCalibrationDiagram,
    inspectionSetup.partType, inspectionSetup.isHollow,
    isSplitMode, activePart, inspectionSetupB.partType, inspectionSetupB.isHollow,
  ]);

  // ── Auto-capture E2375 on scan details tab ─────────────────────────────
  useEffect(() => {
    if (activeTab === "scandetails" && reportMode === "Technique") {
      const timer = setTimeout(async () => {
        const success = await captureE2375DiagramFn();
        if (success && exportCaptures.e2375Diagram) {
          setE2375Diagram(exportCaptures.e2375Diagram);
        }
        const scanSuccess = await captureScanDirections();
        if (scanSuccess && exportCaptures.scanDirectionsView) {
          setCapturedScanDirections(exportCaptures.scanDirectionsView);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeTab, reportMode, captureE2375DiagramFn, captureScanDirections, exportCaptures.e2375Diagram, exportCaptures.scanDirectionsView]);

  // ── Reset captured drawings when Part A geometry changes ──────────────
  useEffect(() => {
    setCapturedDrawing(undefined);
    setCapturedScanDirections(undefined);
    setCalibrationBlockDiagram(undefined);
    setAngleBeamDiagram(undefined);
    setE2375Diagram(undefined);
  }, [
    inspectionSetup.partType, inspectionSetup.diameter, inspectionSetup.innerDiameter,
    inspectionSetup.partThickness, inspectionSetup.partLength, inspectionSetup.partWidth,
    inspectionSetup.isHollow, inspectionSetup.coneTopDiameter,
    inspectionSetup.coneBottomDiameter, inspectionSetup.coneHeight,
  ]);

  // ── Reset for Part B in split mode ────────────────────────────────────
  useEffect(() => {
    if (isSplitMode) {
      // When Part B geometry changes, drawings will be re-captured on export
    }
  }, [
    isSplitMode, inspectionSetupB.partType, inspectionSetupB.diameter,
    inspectionSetupB.innerDiameter, inspectionSetupB.partThickness,
    inspectionSetupB.partLength, inspectionSetupB.partWidth, inspectionSetupB.isHollow,
  ]);

  // ── handleExportPDF – captures all drawings then opens dialog ─────────
  const handleExportPDF = useCallback(async () => {
    if (reportMode !== "Technique") {
      return { shouldOpenDialog: true };
    }

    toast.loading("Preparing drawings for export...", { id: "export-prep" });
    const originalTab = activeTab;
    const { smartCapture, clearCaptureCache } = await import("@/utils/export/captureEngine");

    // Clear capture cache to ensure fresh captures (prevents stale cached images)
    clearCaptureCache();
    const { getBeamRequirement } = await import("@/utils/beamTypeClassification");

    let capturedTechnicalDrawing: string | undefined;
    let capturedFBHDiagram: string | undefined;
    let capturedAngleBeam: string | undefined;
    let capturedE2375: string | undefined;

    try {
      // Step 1: Setup tab – technical drawing
      console.log("[PDF Export] Step 1: Going to Setup tab for technical drawing...");
      setActiveTab("setup");
      await new Promise(resolve => setTimeout(resolve, 1000));

      let drawingCanvas: HTMLCanvasElement | null = null;
      let retryCount = 0;
      const maxRetries = 5;
      while (!drawingCanvas && retryCount < maxRetries) {
        drawingCanvas = document.getElementById("technical-drawing-canvas") as HTMLCanvasElement;
        if (drawingCanvas && drawingCanvas.width > 0 && drawingCanvas.height > 0) break;
        drawingCanvas = null;
        retryCount++;
        console.log(`[PDF Export] Canvas not ready, retry ${retryCount}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (drawingCanvas && drawingCanvas.width > 0 && drawingCanvas.height > 0) {
        try {
          const scale = 3;
          const highResCanvas = document.createElement("canvas");
          highResCanvas.width = drawingCanvas.width * scale;
          highResCanvas.height = drawingCanvas.height * scale;
          const ctx = highResCanvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, highResCanvas.width, highResCanvas.height);
            ctx.scale(scale, scale);
            ctx.drawImage(drawingCanvas, 0, 0);
            const drawingImage = highResCanvas.toDataURL("image/png", 1.0);
            if (drawingImage && drawingImage.length > 100) {
              capturedTechnicalDrawing = drawingImage;
            }
          }
        } catch (error) {
          console.warn("[PDF Export] Could not capture technical drawing:", error);
        }
      }

      // Step 2: Calibration tab – FBH diagram
      console.log("[PDF Export] Step 2: Going to Calibration tab for FBH diagram...");
      setActiveTab("calibration");
      await new Promise(resolve => setTimeout(resolve, 1000));

      const straightTabTrigger = document.querySelector('[value="straight"]') as HTMLElement;
      if (straightTabTrigger) {
        straightTabTrigger.click();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const calibrationResult = await smartCapture([
        // Container with ALL FBH blocks (captures all 3 blocks together)
        "#calibration-blocks-container",
        '[data-testid="calibration-blocks-container"]',
        ".calibration-blocks-preview",
        // Individual SVG fallbacks
        "#calibration-block-svg", 'svg#calibration-block-svg',
        '[data-testid="calibration-block-diagram"]', 'svg[data-testid="calibration-block-diagram"]',
        ".fbh-straight-beam-drawing", "svg.fbh-straight-beam-drawing",
        ".calibration-drawing svg", ".calibration-tab svg",
      ], { scale: 3, quality: 1.0, backgroundColor: "white", maxWidth: 1800, maxHeight: 1200 });

      if (calibrationResult.success && calibrationResult.data) {
        capturedFBHDiagram = calibrationResult.data;
      }

      // Step 2b: Angle beam if needed
      const beamRequirement = getBeamRequirement(currentData.inspectionSetup.partType, currentData.inspectionSetup.isHollow);
      const needsAngleBeam = beamRequirement === "both" || beamRequirement === "angle_only";
      if (needsAngleBeam) {
        const angleTabTrigger = document.querySelector('[value="angle"]') as HTMLElement;
        if (angleTabTrigger) {
          angleTabTrigger.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          const angleImg = document.querySelector('[data-testid="angle-beam-calibration-block"] img') as HTMLImageElement;
          if (angleImg && !angleImg.complete) {
            await new Promise<void>((resolve) => {
              angleImg.onload = () => resolve();
              angleImg.onerror = () => resolve();
              setTimeout(resolve, 3000);
            });
          }
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        const angleBeamResult = await smartCapture([
          '[data-testid="angle-beam-image-capture"]', ".angle-beam-image-capture",
          ".angle-beam-calibration-image", '[data-testid="angle-beam-calibration-block"]',
        ], { scale: 3, quality: 1.0, backgroundColor: "white", maxWidth: 1800, maxHeight: 1200 });
        if (angleBeamResult.success && angleBeamResult.data) {
          capturedAngleBeam = angleBeamResult.data;
        }
      }

      // Step 3: Scan details tab – E2375
      console.log("[PDF Export] Step 3: Going to Scan Details tab for E2375 diagram...");
      setActiveTab("scandetails");
      await new Promise(resolve => setTimeout(resolve, 800));

      const e2375ImgElement = document.querySelector('[data-testid="e2375-diagram-img"]') as HTMLImageElement;
      if (e2375ImgElement && !e2375ImgElement.complete) {
        await new Promise<void>((resolve) => {
          e2375ImgElement.onload = () => resolve();
          e2375ImgElement.onerror = () => resolve();
          setTimeout(resolve, 3000);
        });
      }
      await new Promise(resolve => setTimeout(resolve, 300));

      const e2375Result = await smartCapture([
        '[data-testid="scan-direction-svg"]', 'svg[data-testid="scan-direction-svg"]',
        "#scan-direction-svg", "svg.scan-direction-diagram",
        '[data-testid="e2375-diagram"]', '[data-testid="e2375-diagram"] svg',
        '[data-testid="e2375-diagram-img"]', '[data-testid="e2375-diagram"] img',
        ".e2375-diagram-image img", ".e2375-diagram-container img",
      ], { scale: 3, quality: 1.0, backgroundColor: "white", maxWidth: 1800, maxHeight: 1200 });
      if (e2375Result.success && e2375Result.data) {
        capturedE2375 = e2375Result.data;
      }

      // Step 4: Return to original tab
      setActiveTab(originalTab);

      console.log("[PDF Export] Capture Summary:");
      console.log("  - Technical Drawing:", capturedTechnicalDrawing ? "captured" : "NOT captured");
      console.log("  - FBH Calibration:", capturedFBHDiagram ? "captured" : "NOT captured");
      console.log("  - Angle Beam:", needsAngleBeam ? (capturedAngleBeam ? "captured" : "NOT captured") : "not required");
      console.log("  - E2375 Diagram:", capturedE2375 ? "captured" : "NOT captured");

      flushSync(() => {
        if (capturedTechnicalDrawing) setCapturedDrawing(capturedTechnicalDrawing);
        if (capturedFBHDiagram) setCalibrationBlockDiagram(capturedFBHDiagram);
        if (capturedAngleBeam) setAngleBeamDiagram(capturedAngleBeam);
        if (capturedE2375) setE2375Diagram(capturedE2375);
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      toast.dismiss("export-prep");
      toast.success("Drawings captured successfully!");
      return { shouldOpenDialog: true };
    } catch (error) {
      console.error("Error capturing drawings:", error);
      toast.dismiss("export-prep");
      toast.error("Some drawings could not be captured");
      setActiveTab(originalTab);
      return { shouldOpenDialog: true };
    }
  }, [
    reportMode, activeTab, setActiveTab, currentData,
    captureCalibrationBlock, captureAngleBeamBlock,
  ]);

  return {
    capturedDrawing,
    calibrationBlockDiagram,
    capturedScanDirections,
    angleBeamDiagram,
    e2375Diagram,
    isCaptureInProgress,
    handleExportPDF,
  };
}
