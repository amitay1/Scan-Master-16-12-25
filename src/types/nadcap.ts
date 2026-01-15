/**
 * NADCAP Audit Package Types
 * Types for generating NADCAP-compliant documentation
 */

// NADCAP checklist categories
export type NADCAPCategory =
  | "personnel"
  | "equipment"
  | "calibration"
  | "procedures"
  | "inspection"
  | "records"
  | "quality";

// Checklist item status
export type ChecklistStatus = "compliant" | "non_compliant" | "not_applicable" | "pending";

// NADCAP checklist item
export interface NADCAPChecklistItem {
  id: string;
  category: NADCAPCategory;
  reference: string;        // AC7114 reference number
  requirement: string;      // Requirement text
  status: ChecklistStatus;
  evidence?: string;        // Evidence file/reference
  notes?: string;
  objectiveEvidence?: string[];
  lastReviewed?: string;
  reviewedBy?: string;
}

// Personnel qualification record
export interface PersonnelRecord {
  id: string;
  name: string;
  employeeId: string;
  level: "I" | "II" | "III";
  certificationScheme: string; // NAS 410, EN 4179, etc.
  method: string;              // UT, PT, MT, etc.
  certDate: string;
  expiryDate: string;
  examScores?: {
    general?: number;
    specific?: number;
    practical?: number;
  };
  visionTest?: {
    nearVision: boolean;
    colorVision: boolean;
    testDate: string;
  };
  trainingHours?: number;
  experienceMonths?: number;
  status: "active" | "expired" | "suspended";
}

// Equipment calibration record
export interface EquipmentCalibrationRecord {
  equipmentId: string;
  equipmentName: string;
  serialNumber: string;
  type: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  calibrationStandard: string;
  calibratedBy: string;
  certificateNumber?: string;
  traceable: boolean;
  results: {
    parameter: string;
    nominal: string;
    measured: string;
    tolerance: string;
    pass: boolean;
  }[];
  status: "valid" | "due_soon" | "overdue" | "out_of_service";
}

// Procedure revision record
export interface ProcedureRecord {
  procedureNumber: string;
  title: string;
  revision: string;
  effectiveDate: string;
  approvedBy: string;
  scope: string;
  applicableStandards: string[];
  lastAuditDate?: string;
  auditStatus: "approved" | "needs_revision" | "pending_approval";
}

// Job record for audit trail
export interface JobRecord {
  jobId: string;
  partNumber: string;
  serialNumber?: string;
  customer: string;
  poNumber?: string;
  inspectionDate: string;
  inspector: string;
  inspectorLevel: string;
  procedureUsed: string;
  equipmentUsed: string[];
  calibrationVerified: boolean;
  result: "accept" | "reject";
  indications: number;
  rejectableIndications: number;
  reportNumber: string;
}

// Audit finding
export interface AuditFinding {
  id: string;
  findingNumber: string;
  category: NADCAPCategory;
  severity: "major" | "minor" | "observation";
  description: string;
  requirement: string;
  evidence: string;
  correctiveAction?: string;
  dueDate?: string;
  status: "open" | "in_progress" | "closed" | "verified";
  closedDate?: string;
  verifiedBy?: string;
}

// Complete NADCAP package
export interface NADCAPPackage {
  // Header
  facilityName: string;
  facilityCode?: string;
  accreditationNumber?: string;
  auditDate?: string;
  preparedBy: string;
  preparedDate: string;

  // Checklists
  checklists: NADCAPChecklistItem[];

  // Supporting records
  personnel: PersonnelRecord[];
  equipment: EquipmentCalibrationRecord[];
  procedures: ProcedureRecord[];
  jobRecords: JobRecord[];

  // Findings
  findings: AuditFinding[];

  // Summary statistics
  stats: NADCAPStats;
}

// Package statistics
export interface NADCAPStats {
  totalChecklistItems: number;
  compliantItems: number;
  nonCompliantItems: number;
  pendingItems: number;
  complianceRate: number;

  personnelCount: number;
  activePersonnel: number;
  expiredCerts: number;

  equipmentCount: number;
  calibrationDue: number;
  calibrationOverdue: number;

  openFindings: number;
  closedFindings: number;
}

// AC7114 checklist sections (simplified)
export const AC7114_SECTIONS: {
  category: NADCAPCategory;
  title: string;
  items: { ref: string; requirement: string }[];
}[] = [
  {
    category: "personnel",
    title: "Personnel Qualification & Certification",
    items: [
      { ref: "AC7114/1 §4.1", requirement: "Written practice for personnel qualification established and maintained" },
      { ref: "AC7114/1 §4.2", requirement: "Personnel certified per NAS 410, EN 4179, or equivalent" },
      { ref: "AC7114/1 §4.3", requirement: "Vision tests (near vision and color) performed annually" },
      { ref: "AC7114/1 §4.4", requirement: "Training records maintained and current" },
      { ref: "AC7114/1 §4.5", requirement: "Certification records include exam scores and experience" },
      { ref: "AC7114/1 §4.6", requirement: "Recertification performed before expiry" },
    ],
  },
  {
    category: "equipment",
    title: "Equipment & Calibration",
    items: [
      { ref: "AC7114/1 §5.1", requirement: "Equipment inventory maintained and current" },
      { ref: "AC7114/1 §5.2", requirement: "Calibration procedures established for all equipment" },
      { ref: "AC7114/1 §5.3", requirement: "Calibration traceable to national standards" },
      { ref: "AC7114/1 §5.4", requirement: "Calibration status clearly identified on equipment" },
      { ref: "AC7114/1 §5.5", requirement: "Out-of-tolerance equipment segregated and evaluated" },
      { ref: "AC7114/1 §5.6", requirement: "Reference standards verified and documented" },
    ],
  },
  {
    category: "procedures",
    title: "Procedures & Work Instructions",
    items: [
      { ref: "AC7114/1 §6.1", requirement: "Written procedures for all inspection methods" },
      { ref: "AC7114/1 §6.2", requirement: "Procedures approved by Level III" },
      { ref: "AC7114/1 §6.3", requirement: "Procedure revision control established" },
      { ref: "AC7114/1 §6.4", requirement: "Technique sheets generated for specific parts" },
      { ref: "AC7114/1 §6.5", requirement: "Customer/specification requirements addressed" },
    ],
  },
  {
    category: "inspection",
    title: "Inspection Process Control",
    items: [
      { ref: "AC7114/1 §7.1", requirement: "Calibration verification performed per procedure" },
      { ref: "AC7114/1 §7.2", requirement: "Surface preparation verified before inspection" },
      { ref: "AC7114/1 §7.3", requirement: "100% coverage achieved and documented" },
      { ref: "AC7114/1 §7.4", requirement: "Indications evaluated per acceptance criteria" },
      { ref: "AC7114/1 §7.5", requirement: "Re-inspection performed when required" },
    ],
  },
  {
    category: "records",
    title: "Records & Documentation",
    items: [
      { ref: "AC7114/1 §8.1", requirement: "Inspection reports contain all required information" },
      { ref: "AC7114/1 §8.2", requirement: "Records retained per customer/regulatory requirements" },
      { ref: "AC7114/1 §8.3", requirement: "Traceability maintained from report to calibration" },
      { ref: "AC7114/1 §8.4", requirement: "Electronic records backed up and secure" },
      { ref: "AC7114/1 §8.5", requirement: "Record amendments properly controlled" },
    ],
  },
  {
    category: "quality",
    title: "Quality System",
    items: [
      { ref: "AC7114/1 §9.1", requirement: "Internal audits performed annually" },
      { ref: "AC7114/1 §9.2", requirement: "Corrective action system implemented" },
      { ref: "AC7114/1 §9.3", requirement: "Nonconforming work controlled and documented" },
      { ref: "AC7114/1 §9.4", requirement: "Process control measures established" },
      { ref: "AC7114/1 §9.5", requirement: "Continuous improvement activities documented" },
    ],
  },
];

// Category labels
export const CATEGORY_LABELS: Record<NADCAPCategory, string> = {
  personnel: "Personnel",
  equipment: "Equipment",
  calibration: "Calibration",
  procedures: "Procedures",
  inspection: "Inspection",
  records: "Records",
  quality: "Quality",
};

// Status labels and colors
export const STATUS_CONFIG: Record<ChecklistStatus, { label: string; color: string }> = {
  compliant: { label: "Compliant", color: "text-green-600 bg-green-500/10 border-green-500/30" },
  non_compliant: { label: "Non-Compliant", color: "text-red-600 bg-red-500/10 border-red-500/30" },
  not_applicable: { label: "N/A", color: "text-gray-500 bg-gray-500/10 border-gray-500/30" },
  pending: { label: "Pending", color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/30" },
};
