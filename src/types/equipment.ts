/**
 * Equipment Tracker Types
 * For tracking UT inspection equipment, calibration, and maintenance
 */

// Equipment types
export type EquipmentType =
  | "flaw_detector"
  | "transducer"
  | "cable"
  | "wedge"
  | "calibration_block"
  | "couplant_system"
  | "scanner"
  | "other";

// Equipment status
export type EquipmentStatus =
  | "active"
  | "maintenance"
  | "retired"
  | "out_of_service";

// Calibration result
export type CalibrationResult =
  | "pass"
  | "fail"
  | "adjusted"
  | "limited";

// Calibration status (computed)
export type CalibrationStatus =
  | "valid"
  | "due_soon"
  | "overdue"
  | "unknown";

// Maintenance type
export type MaintenanceType =
  | "routine"
  | "repair"
  | "cleaning"
  | "firmware_update"
  | "replacement"
  | "inspection"
  | "other";

// Equipment specifications (flexible JSON)
export interface EquipmentSpecifications {
  frequency?: number;           // MHz for transducers
  elements?: number;            // Number of elements for phased array
  focalLength?: number;         // mm
  beamAngle?: number;          // degrees
  bandwidth?: number;          // %
  pulserVoltage?: number;      // V
  dampingResistance?: number;  // Ohms
  crystalSize?: number;        // mm
  cableLength?: number;        // m
  impedance?: number;          // Ohms
  wedgeAngle?: number;         // degrees
  [key: string]: unknown;      // Allow additional custom specs
}

// Main Equipment interface
export interface Equipment {
  id: string;
  orgId: string | null;
  userId: string;

  // Identification
  name: string;
  type: EquipmentType;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  assetTag: string | null;

  // Status
  status: EquipmentStatus;
  location: string | null;

  // Calibration tracking
  lastCalibrationDate: string | null;
  nextCalibrationDue: string | null;
  calibrationIntervalDays: number | null;
  calibrationProvider: string | null;
  certificateNumber: string | null;
  certificateUrl: string | null;

  // Specifications
  specifications: EquipmentSpecifications;

  // Additional metadata
  purchaseDate: string | null;
  warrantyExpiry: string | null;
  cost: string | null;
  notes: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Computed fields (added by API)
  calibrationStatus?: CalibrationStatus;
}

// Calibration history record
export interface CalibrationRecord {
  id: string;
  equipmentId: string;

  // Calibration details
  calibrationDate: string;
  nextDueDate: string | null;
  performedBy: string | null;
  calibrationProvider: string | null;
  certificateNumber: string | null;
  certificateUrl: string | null;

  // Results
  result: CalibrationResult;
  deviationNotes: string | null;
  measurements: Record<string, unknown>;

  // Cost
  cost: string | null;
  notes: string | null;

  // Timestamp
  createdAt: string;
}

// Maintenance log record
export interface MaintenanceRecord {
  id: string;
  equipmentId: string;

  // Maintenance details
  maintenanceDate: string;
  maintenanceType: MaintenanceType;
  description: string;
  performedBy: string | null;

  // Cost tracking
  cost: string | null;
  partsReplaced: string | null;
  downtimeHours: string | null;

  notes: string | null;
  createdAt: string;
}

// Equipment type definition (for reference dropdown)
export interface EquipmentTypeDefinition {
  id: EquipmentType;
  name: string;
  description: string;
}

// Equipment statistics
export interface EquipmentStats {
  total: number;
  active: number;
  maintenance: number;
  retired: number;
  outOfService: number;
  calibrationOverdue: number;
  calibrationDueSoon: number;
  byType: Record<EquipmentType, number>;
}

// Form data for creating/updating equipment
export interface EquipmentFormData {
  name: string;
  type: EquipmentType;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  assetTag?: string;
  status?: EquipmentStatus;
  location?: string;
  lastCalibrationDate?: string;
  nextCalibrationDue?: string;
  calibrationIntervalDays?: number;
  calibrationProvider?: string;
  certificateNumber?: string;
  certificateUrl?: string;
  specifications?: EquipmentSpecifications;
  purchaseDate?: string;
  warrantyExpiry?: string;
  cost?: string;
  notes?: string;
}

// Form data for calibration record
export interface CalibrationFormData {
  calibrationDate: string;
  nextDueDate?: string;
  performedBy?: string;
  calibrationProvider?: string;
  certificateNumber?: string;
  certificateUrl?: string;
  result?: CalibrationResult;
  deviationNotes?: string;
  measurements?: Record<string, unknown>;
  cost?: string;
  notes?: string;
}

// Form data for maintenance record
export interface MaintenanceFormData {
  maintenanceDate: string;
  maintenanceType: MaintenanceType;
  description: string;
  performedBy?: string;
  cost?: string;
  partsReplaced?: string;
  downtimeHours?: string;
  notes?: string;
}

// Equipment filter options
export interface EquipmentFilters {
  type?: EquipmentType;
  status?: EquipmentStatus;
  dueSoon?: boolean;
}

// Labels for display
export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  flaw_detector: "Flaw Detector",
  transducer: "Transducer",
  cable: "Cable",
  wedge: "Wedge",
  calibration_block: "Calibration Block",
  couplant_system: "Couplant System",
  scanner: "Scanner",
  other: "Other",
};

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  active: "Active",
  maintenance: "Under Maintenance",
  retired: "Retired",
  out_of_service: "Out of Service",
};

export const CALIBRATION_RESULT_LABELS: Record<CalibrationResult, string> = {
  pass: "Pass",
  fail: "Fail",
  adjusted: "Adjusted",
  limited: "Limited Use",
};

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  routine: "Routine",
  repair: "Repair",
  cleaning: "Cleaning",
  firmware_update: "Firmware Update",
  replacement: "Part Replacement",
  inspection: "Inspection",
  other: "Other",
};

// Status colors for UI
export const CALIBRATION_STATUS_COLORS: Record<CalibrationStatus, string> = {
  valid: "text-green-600 bg-green-100",
  due_soon: "text-yellow-600 bg-yellow-100",
  overdue: "text-red-600 bg-red-100",
  unknown: "text-gray-600 bg-gray-100",
};

export const EQUIPMENT_STATUS_COLORS: Record<EquipmentStatus, string> = {
  active: "text-green-600 bg-green-100",
  maintenance: "text-yellow-600 bg-yellow-100",
  retired: "text-gray-600 bg-gray-100",
  out_of_service: "text-red-600 bg-red-100",
};
