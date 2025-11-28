import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Settings, 
  FileText,
  Wrench
} from "lucide-react";
import { toast } from "sonner";
import type {
  ScanMasterCADRequest,
  ScanMasterCADResponse,
  CalibrationTabFields,
  InspectionSetupTabFields,
  EquipmentTabFields,
  DrillingReportDisplay
} from "@/types/scanMasterCAD";
import { LoadingState } from "@/types/scanMasterCAD";

interface CalibrationCADIntegrationProps {
  // Data from tabs
  calibrationData: CalibrationTabFields;
  inspectionData: InspectionSetupTabFields;
  equipmentData: EquipmentTabFields;

  // Metadata
  userId?: string;
  projectId?: string;

  // Callbacks
  onSuccess?: (result: ScanMasterCADResponse) => void;
  onError?: (error: string) => void;
}

// Default values for missing data
const getDefaultCalibrationData = (calibrationData: CalibrationTabFields): CalibrationTabFields => ({
  fbhSizes: calibrationData.fbhSizes || "3/64, 1/8, 1/4",
  metalTravelDistance: calibrationData.metalTravelDistance || 25.4,
  blockDimensions: {
    L: calibrationData.blockDimensions?.L || 150,
    W: calibrationData.blockDimensions?.W || 75,
    H: calibrationData.blockDimensions?.H || 50,
  },
  standardType: calibrationData.standardType || "MIL-STD-2154",
});

const getDefaultInspectionData = (inspectionData: InspectionSetupTabFields): InspectionSetupTabFields => ({
  material: inspectionData.material || "Steel",
  partThickness: inspectionData.partThickness || 25,
  partType: inspectionData.partType || "Plate",
  isHollow: inspectionData.isHollow || false,
  acceptanceClass: inspectionData.acceptanceClass || "Class A",
});

const getDefaultEquipmentData = (equipmentData: EquipmentTabFields): EquipmentTabFields => ({
  probeType: equipmentData.probeType || "Straight Beam",
  frequency: equipmentData.frequency || 5.0,
  inspectionType: equipmentData.inspectionType || "UT",
});

export const CalibrationCADIntegration: React.FC<CalibrationCADIntegrationProps> = ({
  calibrationData,
  inspectionData,
  equipmentData,
  userId,
  projectId,
  onSuccess,
  onError
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentState, setCurrentState] = useState<LoadingState>(LoadingState.IDLE);
  const [progress, setProgress] = useState(0);
  const [lastResult, setLastResult] = useState<ScanMasterCADResponse | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [includeScanDirections, setIncludeScanDirections] = useState(true); // Toggle for scanning directions

  // Debug logging
  console.log('🎛️ CalibrationCADIntegration rendered with:', {
    calibrationData,
    inspectionData,
    equipmentData,
    userId,
    projectId
  });

  // Validate required fields
  const validateRequiredFields = (): string[] => {
    const errors: string[] = [];

    if (!calibrationData.blockDimensions.L || calibrationData.blockDimensions.L <= 0) {
      errors.push("Block length must be greater than 0");
    }
    if (!calibrationData.blockDimensions.W || calibrationData.blockDimensions.W <= 0) {
      errors.push("Block width must be greater than 0");
    }
    if (!calibrationData.blockDimensions.H || calibrationData.blockDimensions.H <= 0) {
      errors.push("Block height must be greater than 0");
    }
    if (!inspectionData.material) {
      errors.push("Please select material in Inspection Setup tab");
    }
    if (!inspectionData.acceptanceClass) {
      errors.push("Please select acceptance class in Inspection Setup tab");
    }

    return errors;
  };

  // Simulate progress
  const simulateProgress = () => {
    const states = [
      { state: LoadingState.PROCESSING, progress: 10 },
      { state: LoadingState.CALCULATING, progress: 30 },
      { state: LoadingState.DRILLING, progress: 60 },
      { state: LoadingState.GENERATING, progress: 85 },
      { state: LoadingState.FINISHING, progress: 95 }
    ];

    states.forEach(({ state, progress: targetProgress }, index) => {
      setTimeout(() => {
        setCurrentState(state);
        setProgress(targetProgress);
      }, index * 1000);
    });
  };

  const handleGenerateCAD = async () => {
    console.log('🚀 Starting CAD generation');
    console.log('📊 Calibration data:', calibrationData);
    console.log('🔍 Inspection data:', inspectionData);
    console.log('⚙️ Equipment data:', equipmentData);

    // Validate required fields
    const validationErrors = validateRequiredFields();
    console.log('✅ Validation errors:', validationErrors);

    if (validationErrors.length > 0) {
      toast.error("Validation errors", {
        description: validationErrors.join(", ")
      });
      onError?.(validationErrors.join(", "));
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setCurrentState(LoadingState.PROCESSING);
    simulateProgress();

    try {
      // Ensure data with defaults
      const safeCalibrationData = getDefaultCalibrationData(calibrationData);
      const safeInspectionData = getDefaultInspectionData(inspectionData);
      const safeEquipmentData = getDefaultEquipmentData(equipmentData);
      
      // ============================================================================
      // CALIBRATION BLOCK TYPE SELECTION
      // ============================================================================
      // The calibration block type is determined by:
      // 1. The recommended block type from the calibration recommender (if available)
      // 2. The beam type (straight vs angle) - different blocks for each
      // 3. The part geometry being inspected
      //
      // STRAIGHT BEAM (0°) - Uses FBH (Flat Bottom Holes):
      //   - flat_block / calibration_block: For plates, bars, flat forgings
      //   - curved_block: For curved surfaces (convex/concave)
      //   - cylinder_fbh: For hollow cylinders/tubes (FBH on curved surface)
      //
      // ANGLE BEAM (45°, 60°, 70°) - Uses SDH (Side Drilled Holes) or Notches:
      //   - iiv_block / iiw_v1: IIW Type 1 block for angle beam calibration
      //   - angle_beam: Angle beam block with SDH
      //   - cylinder_notched: Hollow cylinder with notches for pipe/tube welds
      // ============================================================================
      
      const beamType = safeEquipmentData.beamType || 
                       (safeEquipmentData.probeType?.toLowerCase().includes('angle') ? 'angle' : 'straight');
      const partType = safeInspectionData.partType?.toLowerCase() || "plate";
      const isHollow = safeInspectionData.isHollow || 
                       ['tube', 'pipe', 'hollow_cylinder', 'ring', 'sleeve'].includes(partType);
      
      // Use recommended block type if available, otherwise determine from context
      let blockType = calibrationData.recommendedBlockType;
      
      if (!blockType) {
        // Determine block type based on beam type and part geometry
        if (beamType === 'angle') {
          // ANGLE BEAM inspection
          if (isHollow || ['tube', 'pipe'].includes(partType)) {
            // For pipe/tube welds - use notched cylinder
            blockType = 'cylinder_notched';
          } else {
            // For flat parts, welds - use IIW block
            blockType = 'iiv_block';
          }
        } else {
          // STRAIGHT BEAM inspection
          if (isHollow || ['tube', 'pipe', 'hollow_cylinder'].includes(partType)) {
            // Hollow cylindrical - use cylinder with FBH
            blockType = 'cylinder_fbh';
          } else if (['cylinder', 'rod', 'bar', 'round_bar', 'shaft'].includes(partType)) {
            // Solid round parts - curved block to match surface
            blockType = 'curved_block';
          } else {
            // Flat parts (plates, bars, forgings) - flat block
            blockType = 'flat_block';
          }
        }
      }
      
      // Map block type to CAD engine shape type and parameters
      let shapeType: string;
      let parameters: Record<string, number>;
      
      switch (blockType) {
        case 'cylinder_fbh':
        case 'cylinder_notched':
          // Cylindrical calibration block
          shapeType = isHollow ? "tube" : "cylinder";
          if (isHollow) {
            const outerDiameter = safeCalibrationData.blockDimensions.W || 50;
            const wallThickness = safeCalibrationData.blockDimensions.H || 10;
            parameters = {
              outerDiameter: outerDiameter,
              innerDiameter: outerDiameter - (2 * wallThickness),
              length: safeCalibrationData.blockDimensions.L || 100,
            };
          } else {
            parameters = {
              diameter: safeCalibrationData.blockDimensions.W || 50,
              length: safeCalibrationData.blockDimensions.L || 100,
            };
          }
          break;
          
        case 'curved_block':
          // Curved surface block (for solid cylinders inspected radially)
          shapeType = "curved_block";
          parameters = {
            length: safeCalibrationData.blockDimensions.L || 150,
            width: safeCalibrationData.blockDimensions.W || 75,
            height: safeCalibrationData.blockDimensions.H || 50,
            radius: safeCalibrationData.blockDimensions.W || 75, // Curve radius matches part
          };
          break;
          
        case 'iiv_block':
        case 'angle_beam':
          // IIW/Angle beam block - always rectangular with SDH
          shapeType = "iiw_block";
          parameters = {
            length: 300, // Standard IIW dimensions
            width: 100,
            height: 25,
          };
          break;
          
        case 'step_wedge':
          // Step wedge for thickness calibration
          shapeType = "step_wedge";
          parameters = {
            length: safeCalibrationData.blockDimensions.L || 200,
            width: safeCalibrationData.blockDimensions.W || 60,
            maxHeight: safeCalibrationData.blockDimensions.H || 50,
            steps: 5,
          };
          break;
          
        default:
          // Default: Flat rectangular calibration block with FBH
          shapeType = "calibration_block";
          parameters = {
            length: safeCalibrationData.blockDimensions.L || 150,
            width: safeCalibrationData.blockDimensions.W || 75,
            height: safeCalibrationData.blockDimensions.H || 50,
          };
      }

      const requestData = {
        shapeType: shapeType,
        parameters: parameters,
        calibrationData: {
          // Required data according to engine specification
          fbhSizes: safeCalibrationData.fbhSizes,
          metalTravelDistance: Number(safeCalibrationData.metalTravelDistance) || 25.4,
          blockDimensions: {
            L: Number(safeCalibrationData.blockDimensions.L) || 150,
            W: Number(safeCalibrationData.blockDimensions.W) || 75,
            H: Number(safeCalibrationData.blockDimensions.H) || 50,
          },
          partThickness: Number(safeInspectionData.partThickness) || 25,
          standardType: safeCalibrationData.standardType || "MIL-STD-2154",
          material: safeInspectionData.material || "aluminum",
          acceptanceClass: safeInspectionData.acceptanceClass || "A",

          // Block type info for the CAD engine
          blockType: blockType,
          beamType: beamType,
          partType: partType,
          isHollow: isHollow,

          // Scanning directions visualization
          includeScanDirections: includeScanDirections,

          // Optional data
          probeType: safeEquipmentData.probeType,
          frequency: Number(safeEquipmentData.frequency) || 5.0,
        },
        metadata: {
          userId,
          projectId,
          partName: `Calibration_Block_${blockType}_${Date.now()}`,
        }
      };
      
      console.log('📤 Sending CAD request to:', '/api/cad/engine/parts');
      console.log('📤 Request data:', JSON.stringify(requestData, null, 2));
      
      const response = await fetch('/api/cad/engine/parts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '00000000-0000-0000-0000-000000000000',
        },
        body: JSON.stringify(requestData),
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseData = await response.json() as {
        stepUrl?: string;
        jobId?: string;
        engineResult?: ScanMasterCADResponse;
        error?: string;
        fieldErrors?: Record<string, string[]>
      };
      console.log('📥 Full response:', responseData);

      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, responseData);
        if (responseData.fieldErrors) {
          console.error('❌ Field Errors:', responseData.fieldErrors);
        }
        throw new Error(responseData.error || `HTTP ${response.status}`);
      }

      // Extract the actual result from engineResult
      const result = responseData.engineResult;
      if (result && result.success) {
        setProgress(100);

        // Create a combined result with stepUrl for downloading
        const combinedResult = {
          ...result,
          stepUrl: responseData.stepUrl,
          jobId: responseData.jobId
        } as ScanMasterCADResponse & { stepUrl?: string; jobId?: string };

        setLastResult(combinedResult);

        toast.success("Calibration block created successfully! 🎉", {
          description: `${result.partInfo?.holesCount || 0} FBH holes drilled successfully`
        });

        onSuccess?.(combinedResult);
      } else {
        throw new Error(result?.message || 'Failed to generate CAD');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Error creating calibration block", {
        description: errorMessage
      });
      onError?.(errorMessage);
    } finally {
      setIsGenerating(false);
      setCurrentState(LoadingState.IDLE);
    }
  };

  const handleDownloadSTEP = () => {
    const stepPath = lastResult?.stepUrl || lastResult?.outputPath;
    if (stepPath) {
      const link = document.createElement('a');
      link.href = stepPath;
      link.download = `calibration_block_${Date.now()}.step`;
      link.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatExecutionTime = (seconds: number): string => {
    return `${seconds.toFixed(2)} seconds`;
  };

  const formatConfidence = (score: number): string => {
    return `${Math.round(score * 100)}% confidence`;
  };

  return (
    <div className="calibration-cad-integration space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🏗️ ScanMaster CAD Engine
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create professional calibration block with automatic FBH hole drilling according to international standards
            </p>
          </div>
        </div>
      </Card>

      {/* Current parameters */}
      <Card className="p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Current Creation Parameters
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Material:</span>
            <Badge variant="outline" className="ml-1">
              {inspectionData.material || "Not selected"}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Acceptance Class:</span>
            <Badge variant="outline" className="ml-1">
              {inspectionData.acceptanceClass || "Not selected"}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Thickness:</span>
            <Badge variant="outline" className="ml-1">
              {inspectionData.partThickness || 0}mm
            </Badge>
          </div>
          <div>
            <span className="font-medium">Block Dimensions:</span>
            <Badge variant="outline" className="ml-1">
              {calibrationData.blockDimensions.L}×{calibrationData.blockDimensions.W}×{calibrationData.blockDimensions.H}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Creation options */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="includeScanDirections"
            checked={includeScanDirections}
            onChange={(e) => setIncludeScanDirections(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="includeScanDirections" className="text-sm font-medium cursor-pointer">
            Add scanning direction arrows to model (Scanning Directions)
          </label>
        </div>
        <p className="text-xs text-muted-foreground mt-2 mr-7">
          Adds direction arrows to the CAD model showing the recommended ultrasound directions according to standard
        </p>
      </Card>

      {/* Create button */}
      <div className="text-center">
        <Button
          onClick={handleGenerateCAD}
          disabled={isGenerating}
          size="lg"
          className="w-full md:w-auto min-w-[300px] gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {currentState}
            </>
          ) : (
            <>
              <Wrench className="h-5 w-5" />
              Create Calibration Block + STEP File
            </>
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{currentState}</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </Card>
      )}

      {/* Results */}
      {lastResult && !isGenerating && (
        <Card className="p-6 border-green-200 bg-green-50/50">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">
                    ✅ Calibration block created successfully
                  </h3>
                  <p className="text-sm text-green-700">
                    {lastResult.partInfo.drillingReport && 
                      formatConfidence(lastResult.partInfo.drillingReport.confidenceScore)
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* File Details */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">
                    📁 calibration_block_{Date.now()}.step
                  </div>
                  <div className="text-sm text-muted-foreground flex gap-4">
                    <span>📏 {formatFileSize(lastResult.partInfo.fileSize)}</span>
                    <span>⏱️ {formatExecutionTime(lastResult.executionTime)}</span>
                    <span>🔩 {lastResult.partInfo.holesCount} holes</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReport(!showReport)}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Drilling Report
                </Button>
                <Button
                  onClick={handleDownloadSTEP}
                  size="sm"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download STEP
                </Button>
              </div>
            </div>

            {/* Detailed drilling report */}
            {showReport && lastResult.partInfo.drillingReport && (
              <Card className="p-4 bg-blue-50/50 border-blue-200">
                <h4 className="font-medium mb-3">📊 Detailed Drilling Report</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Drilling Method:</span>
                      <div>{lastResult.partInfo.drillingReport.drillingMethod}</div>
                    </div>
                    <div>
                      <span className="font-medium">Standards Compliance:</span>
                      <div>{lastResult.partInfo.drillingReport.standardsCompliance}</div>
                    </div>
                  </div>

                  {/* Hole details */}
                  <div>
                    <span className="font-medium">Hole Details:</span>
                    <div className="mt-2 space-y-1">
                      {lastResult.partInfo.drillingReport.holeDetails.map((hole, index) => (
                        <div key={index} className="text-sm bg-white p-2 rounded border">
                          <span className="font-mono">{hole.idNum}</span>: 
                          ⌀{hole.diameter.toFixed(2)}mm × {hole.depth.toFixed(1)}mm 
                          ({hole.note})
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="pt-2 border-t">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Average Depth:</span>
                        <div>{lastResult.partInfo.drillingReport.drillingStatistics.averageDepth.toFixed(1)}mm</div>
                      </div>
                      <div>
                        <span className="font-medium">Total Volume:</span>
                        <div>{lastResult.partInfo.drillingReport.drillingStatistics.totalVolume.toFixed(1)} mm³</div>
                      </div>
                      <div>
                        <span className="font-medium">Unique Diameters:</span>
                        <div>{lastResult.partInfo.drillingReport.drillingStatistics.uniqueDiameters}</div>
                      </div>
                    </div>
                  </div>

                  {/* Scanning Directions Info */}
                  {lastResult.partInfo.drillingReport.scanningDirections?.hasDirections && (
                    <div className="mt-4 pt-4 border-t">
                      <span className="font-medium text-blue-900">📍 Scanning Directions:</span>
                      <div className="mt-2 space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Geometry Type:</span>
                            <Badge variant="outline" className="ml-2">
                              {lastResult.partInfo.drillingReport.scanningDirections.geometryType}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium">Primary Direction:</span>
                            <Badge variant="outline" className="ml-2">
                              {lastResult.partInfo.drillingReport.scanningDirections.primaryDirection}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium">Scan Pattern:</span>
                            <Badge variant="outline" className="ml-2">
                              {lastResult.partInfo.drillingReport.scanningDirections.scanPattern}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium">Direction Arrows:</span>
                            <Badge variant="outline" className="ml-2">
                              {lastResult.partInfo.drillingReport.scanningDirections.arrowCount}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-blue-700 bg-blue-100/50 p-2 rounded">
                          <strong>Coverage Required:</strong> {lastResult.partInfo.drillingReport.scanningDirections.coverageRequirement} |
                          <strong className="ml-2">Number of Passes:</strong> {lastResult.partInfo.drillingReport.scanningDirections.numPasses} |
                          <strong className="ml-2">Overlap:</strong> {lastResult.partInfo.drillingReport.scanningDirections.overlapPercent}%
                        </div>
                        {lastResult.partInfo.drillingReport.scanningDirections.standards && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Standards:</strong> {lastResult.partInfo.drillingReport.scanningDirections.standards.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};