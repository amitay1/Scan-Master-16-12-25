import type {
  StandardType,
  InspectionSetupData,
  EquipmentData,
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  DocumentationData,
} from "@/types/techniqueSheet";

export type ExportFormat = "pdf" | "word" | "html";

export type ExportTemplate = "minimal" | "standard" | "comprehensive" | "tuv";

export interface ExportOptions {
  format: ExportFormat;
  template: ExportTemplate;
  includeWatermark?: boolean;
  companyLogo?: string;
  companyName?: string;
  companyAddress?: string;
  includeTableOfContents?: boolean;
  includePageNumbers?: boolean;
  colorScheme?: ColorScheme;
  customHeader?: string;
  customFooter?: string;
  filename?: string;
  // TÜV-specific options
  documentNumber?: string;
  revisionNumber?: string;
  revisionDate?: string;
  revisionDescription?: string;
  language?: "english" | "hebrew" | "bilingual";
  certificationLevel?: "Level I" | "Level II" | "Level III";
  inspectorCertification?: string;
  controlledCopy?: boolean;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  text: string;
  textLight: string;
}

export const defaultColorScheme: ColorScheme = {
  primary: "#2563EB",
  secondary: "#64748B",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  background: "#F8FAFC",
  text: "#0F172A",
  textLight: "#475569",
};

export interface ExportData {
  standard: StandardType;
  inspectionSetup: InspectionSetupData;
  equipment: EquipmentData;
  calibration: CalibrationData;
  scanParameters: ScanParametersData;
  acceptanceCriteria: AcceptanceCriteriaData;
  documentation: DocumentationData;
  partDiagram?: string; // Base64 image
  scanImages?: string[]; // Base64 images
  calibrationBlockDiagram?: string; // Base64 image
}

export interface ExportSection {
  id: string;
  title: string;
  includeInMinimal: boolean;
  includeInStandard: boolean;
  includeInComprehensive: boolean;
  order: number;
}

export const exportSections: ExportSection[] = [
  {
    id: "coverPage",
    title: "Cover Page",
    includeInMinimal: false,
    includeInStandard: true,
    includeInComprehensive: true,
    order: 1,
  },
  {
    id: "inspectionSetup",
    title: "Inspection Setup",
    includeInMinimal: true,
    includeInStandard: true,
    includeInComprehensive: true,
    order: 2,
  },
  {
    id: "equipment",
    title: "Equipment",
    includeInMinimal: true,
    includeInStandard: true,
    includeInComprehensive: true,
    order: 3,
  },
  {
    id: "calibration",
    title: "Calibration",
    includeInMinimal: true,
    includeInStandard: true,
    includeInComprehensive: true,
    order: 4,
  },
  {
    id: "calibrationDiagram",
    title: "Calibration Block Diagram",
    includeInMinimal: false,
    includeInStandard: true,
    includeInComprehensive: true,
    order: 5,
  },
  {
    id: "scanParameters",
    title: "Scan Parameters",
    includeInMinimal: true,
    includeInStandard: true,
    includeInComprehensive: true,
    order: 6,
  },
  {
    id: "acceptanceCriteria",
    title: "Acceptance Criteria",
    includeInMinimal: true,
    includeInStandard: true,
    includeInComprehensive: true,
    order: 7,
  },
  {
    id: "partDiagram",
    title: "Part Diagram",
    includeInMinimal: false,
    includeInStandard: true,
    includeInComprehensive: true,
    order: 8,
  },
  {
    id: "documentation",
    title: "Documentation",
    includeInMinimal: true,
    includeInStandard: true,
    includeInComprehensive: true,
    order: 9,
  },
  {
    id: "scanImages",
    title: "Scan Images",
    includeInMinimal: false,
    includeInStandard: false,
    includeInComprehensive: true,
    order: 10,
  },
  {
    id: "approvals",
    title: "Approval Signatures",
    includeInMinimal: false,
    includeInStandard: true,
    includeInComprehensive: true,
    order: 11,
  },
];

export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
  blob?: Blob;
}