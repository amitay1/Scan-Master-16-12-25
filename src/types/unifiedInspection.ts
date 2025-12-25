// Unified Inspection Data Model - Combines Technique Sheet and Report Data
import { MaterialType } from "./techniqueSheet";
import { ScanDetailsData } from "./scanDetails";

// === Main Data Structure ===
export interface UnifiedInspectionData {
  // Project & Setup (combines Setup + Cover Page)
  project: ProjectSetupData;

  // Equipment & Calibration (combines Equipment + Calibration + Probe Details)
  equipment: EquipmentCalibrationData;

  // Scan Planning (combines Scan Details + Parameters + Technical Drawing)
  scanPlan: ScanPlanningData;

  // Procedures & Standards
  procedures: ProceduresStandardsData;

  // Results & Data (for actual inspection results)
  results: ResultsData;

  // Documentation (combines current Documentation + Remarks)
  documentation: DocumentationData;

  // Export & Approval
  exportApproval: ExportApprovalData;

  // Metadata
  metadata: MetadataInfo;
}

// === Tab Data Structures ===

// 1. Project & Setup Tab
export interface ProjectSetupData {
  // Customer/PO Information
  customerName: string;
  customerPO: string;
  customerContact: string;
  customerEmail: string;
  customerPhone: string;

  // Part Specifications
  partNumber: string;
  partName: string;
  partSerialNumber: string;
  partDescription: string;
  partType: string;
  drawingNumber: string;
  revisionNumber: string;

  // Material Properties
  material: MaterialType | string;
  materialSpec: string;
  materialGrade: string;
  heatTreatment: string;
  surfaceCondition: string;

  // Dimensions
  partThickness: number;
  partLength: number;
  partWidth: number;
  diameter?: number;
  innerDiameter?: number;
  wallThickness?: number;
  isHollow?: boolean;
  innerLength?: number;
  innerWidth?: number;

  // Document Control
  documentNumber: string;
  documentRevision: string;
  documentDate: string;
  controlledCopy: boolean;
  copyNumber: string;
}

// 2. Equipment & Calibration Tab
export interface EquipmentCalibrationData {
  // UT Equipment Specifications
  manufacturer: string;
  model: string;
  serialNumber: string;
  calibrationDueDate: string;

  // Probe Details (array for multiple probes)
  probes: ProbeDetail[];

  // Calibration Blocks
  calibrationBlocks: CalibrationBlock[];

  // DAC/TCG Curves
  dacCurves: DACCurveData[];

  // Reference Standards
  referenceStandards: ReferenceStandard[];

  // Transfer Correction
  transferCorrection: TransferCorrectionData;
}

export interface ProbeDetail {
  id: string;
  type: string;
  frequency: number;
  diameter: number;
  angle?: number;
  serialNumber: string;
  manufacturer: string;
  couplant: string;
  wedgeAngle?: number;
  roofAngle?: number;
  mode: "PE" | "SE" | "TR" | "TT";
}

export interface CalibrationBlock {
  id: string;
  name: string;
  type: string;
  material: string;
  thickness: number;
  serialNumber: string;
  standard: string;
  diagram?: string; // Base64 image or SVG
  features: CalibrationFeature[];
}

export interface CalibrationFeature {
  type: "SDH" | "FBH" | "Notch" | "Step";
  size: number;
  depth: number;
  location: string;
}

export interface DACCurveData {
  probeId: string;
  points: { distance: number; amplitude: number }[];
  transferCorrection: number;
  scanGain: number;
  referenceSensitivity: number;
}

export interface ReferenceStandard {
  standard: string;
  description: string;
  applicableRange: string;
}

export interface TransferCorrectionData {
  method: string;
  correctionValue: number;
  verificationBlock: string;
}

// 3. Scan Planning Tab
export interface ScanPlanningData {
  // Technical Drawing Data
  drawingData: TechnicalDrawingData;

  // Scan Directions
  scanDirections: ScanDirection[];

  // Coverage Parameters
  coverage: CoverageParameters;

  // Scan Speed & Index
  scanSpeed: number;
  scanIndex: number;
  overlapPercentage: number;

  // Grid Mapping
  gridMapping?: GridMappingData;
}

export interface TechnicalDrawingData {
  partViews: PartView[];
  scanOverlays: ScanOverlay[];
  dimensionAnnotations: DimensionAnnotation[];
  legendData: LegendData;
}

export interface PartView {
  viewType: "top" | "side" | "front" | "isometric";
  svgData: string;
  scale: number;
}

export interface ScanOverlay {
  scanId: string;
  pathData: string;
  color: string;
  pattern: string;
  opacity: number;
}

export interface DimensionAnnotation {
  type: string;
  value: number;
  unit: string;
  position: { x: number; y: number };
}

export interface LegendData {
  scanTypes: { id: string; color: string; description: string }[];
  symbols: { symbol: string; meaning: string }[];
}

export interface ScanDirection {
  id: string;
  direction: string;
  waveMode: "Longitudinal" | "Shear" | "Surface";
  probeAngle: number;
  coverage: number;
  isVisible: boolean;
  color: string;
}

export interface CoverageParameters {
  method: string;
  totalArea: number;
  coveredArea: number;
  coveragePercentage: number;
  criticalZones: CriticalZone[];
}

export interface CriticalZone {
  id: string;
  location: string;
  area: number;
  requiredCoverage: number;
  actualCoverage: number;
}

export interface GridMappingData {
  gridSize: { x: number; y: number };
  cellSize: number;
  mappedCells: GridCell[];
}

export interface GridCell {
  id: string;
  position: { x: number; y: number };
  status: "scanned" | "pending" | "blocked";
  data?: any;
}

// 4. Procedures & Standards Tab
export interface ProceduresStandardsData {
  // Surface Preparation
  surfacePrep: SurfacePrepData;

  // Step-by-step Procedures
  procedures: ProcedureStep[];

  // Acceptance Criteria
  acceptanceCriteria: AcceptanceCriteriaData;

  // Reference Standards
  applicableStandards: ApplicableStandard[];

  // Transfer Correction Procedures
  transferProcedures: TransferProcedure[];
}

export interface SurfacePrepData {
  method: string;
  roughnessRequirement: string;
  cleaningMethod: string;
  couplantType: string;
  temperatureRange: string;
}

export interface ProcedureStep {
  stepNumber: number;
  description: string;
  equipment: string[];
  parameters: { [key: string]: any };
  acceptanceCriteria?: string;
  notes?: string;
}

export interface AcceptanceCriteriaData {
  acceptanceClass: string;
  standard: string;
  evaluationLevel: number;
  recordingLevel: number;
  acceptanceLevel: number;
  indications: IndicationCriteria[];
}

export interface IndicationCriteria {
  type: string;
  maxSize: number;
  maxNumber: number;
  evaluationMethod: string;
}

export interface ApplicableStandard {
  code: string;
  title: string;
  section: string;
  requirement: string;
}

export interface TransferProcedure {
  step: number;
  description: string;
  calculation: string;
  result: number;
}

// 5. Results & Data Tab
export interface ResultsData {
  // Scan Results Tables
  scanResults: ScanResult[];

  // Indication Plotting
  indications: Indication[];

  // Data Recording Forms
  dataForms: DataForm[];

  // Statistical Analysis
  statistics: StatisticalAnalysis;
}

export interface ScanResult {
  scanId: string;
  location: string;
  probeUsed: string;
  gain: number;
  indications: number;
  status: "Accept" | "Reject" | "Review";
  comments: string;
}

export interface Indication {
  id: string;
  location: { x: number; y: number; z: number };
  amplitude: number;
  size: number;
  type: string;
  evaluation: string;
  disposition: "Accept" | "Reject" | "Repair";
}

export interface DataForm {
  formType: string;
  data: { [key: string]: any };
  completedBy: string;
  completedDate: string;
}

export interface StatisticalAnalysis {
  totalScans: number;
  acceptedScans: number;
  rejectedScans: number;
  indicationsFound: number;
  criticalFindings: number;
  charts: ChartData[];
}

export interface ChartData {
  type: "bar" | "line" | "pie" | "scatter";
  title: string;
  data: any;
}

// 6. Documentation Tab
export interface DocumentationData {
  // Inspector/Reviewer/Approver Details
  personnel: PersonnelData;

  // Procedures & Notes
  procedures: string[];
  notes: string;

  // Remarks & Observations
  remarks: Remark[];

  // Revision History
  revisionHistory: Revision[];

  // Attachments
  attachments: Attachment[];
}

export interface PersonnelData {
  inspector: PersonDetail;
  reviewer?: PersonDetail;
  approver?: PersonDetail;
  client?: PersonDetail;
}

export interface PersonDetail {
  name: string;
  certification: string;
  level: string;
  signature?: string;
  date: string;
  company: string;
  email?: string;
  phone?: string;
}

export interface Remark {
  id: string;
  category: string;
  text: string;
  addedBy: string;
  timestamp: string;
  attachments?: string[];
}

export interface Revision {
  revision: string;
  date: string;
  description: string;
  changedBy: string;
  approvedBy: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedDate: string;
}

// 7. Export & Approval Tab
export interface ExportApprovalData {
  // Export Template Selection
  selectedTemplate: ExportTemplate;

  // Preview Settings
  previewSettings: PreviewSettings;

  // Approval Workflow
  approvalWorkflow: ApprovalWorkflow;

  // Digital Signatures
  signatures: DigitalSignature[];

  // Export History
  exportHistory: ExportRecord[];
}

export type ExportTemplate = "tuv" | "chw" | "iai" | "custom";

export interface PreviewSettings {
  includeImages: boolean;
  includeTables: boolean;
  includeCharts: boolean;
  language: "en" | "he" | "both";
  watermark?: string;
}

export interface ApprovalWorkflow {
  stages: ApprovalStage[];
  currentStage: string;
  status: "draft" | "review" | "approved" | "rejected";
}

export interface ApprovalStage {
  id: string;
  name: string;
  requiredRole: string;
  approvers: string[];
  status: "pending" | "approved" | "rejected";
  comments?: string;
  timestamp?: string;
}

export interface DigitalSignature {
  signerId: string;
  signature: string;
  timestamp: string;
  certificate?: string;
}

export interface ExportRecord {
  id: string;
  template: string;
  exportedBy: string;
  exportedDate: string;
  format: string;
  size: number;
  url: string;
}

// 8. Metadata
export interface MetadataInfo {
  projectId: string;
  version: string;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  status: "draft" | "active" | "archived";
  tags: string[];
}

// === Helper Types ===
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "critical";
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// === State Management Interface ===
export interface UnifiedInspectionState {
  data: UnifiedInspectionData;
  isDirty: boolean;
  validationStatus: ValidationResult;
  currentTab: string;

  // Actions
  updateProject: (data: Partial<ProjectSetupData>) => void;
  updateEquipment: (data: Partial<EquipmentCalibrationData>) => void;
  updateScanPlan: (data: Partial<ScanPlanningData>) => void;
  updateProcedures: (data: Partial<ProceduresStandardsData>) => void;
  updateResults: (data: Partial<ResultsData>) => void;
  updateDocumentation: (data: Partial<DocumentationData>) => void;
  updateExportApproval: (data: Partial<ExportApprovalData>) => void;

  // Utilities
  validate: () => ValidationResult;
  save: () => Promise<void>;
  load: (id: string) => Promise<void>;
  export: (template: ExportTemplate) => Promise<void>;
  reset: () => void;
}