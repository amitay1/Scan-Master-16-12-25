/**
 * Unified Export Service
 * =====================
 * מערכת ייצוא מאוחדת - מסמך אחד מלא במקום שני ייצואים נפרדים
 * 
 * פותרת את הבעיה של:
 * - Technique Mode: מייצא רק תכנון (לפני הבדיקה)
 * - Report Mode: מייצא רק תוצאות (אחרי הבדיקה)
 * 
 * עכשיו: ייצוא אחד שכולל הכל!
 */

import type { 
  UnifiedInspectionData, 
  ExportApprovalData,
  ExportTemplate,
  ProjectSetupData,
  EquipmentCalibrationData,
  ScanPlanningData,
  ProceduresStandardsData,
  ResultsData,
  DocumentationData,
} from "@/types/unifiedInspection";
import type { 
  InspectionSetupData, 
  EquipmentData, 
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  DocumentationData as TechniqueDocumentationData
} from "@/types/techniqueSheet";
import type { InspectionReportData } from "@/types/inspectionReport";
import type { ScanDetailsData } from "@/types/scanDetails";

// === ממשקים לתבניות ייצוא ===

export interface ExportTemplateConfig {
  id: ExportTemplate;
  name: string;
  nameHe: string;
  description: string;
  descriptionHe: string;
  pageCount: string;
  icon: string;
  sections: ExportSection[];
  features: string[];
  supportsBilingual: boolean;
  requiresApproval: boolean;
}

export interface ExportSection {
  id: string;
  name: string;
  nameHe: string;
  required: boolean;
  order: number;
  pages: number;
  includeInPreInspection: boolean;  // לפני הבדיקה
  includeInPostInspection: boolean; // אחרי הבדיקה
  includeInFull: boolean;           // מסמך מלא
}

// === הגדרת תבניות ===

export const EXPORT_TEMPLATES: ExportTemplateConfig[] = [
  {
    id: "tuv",
    name: "TÜV Professional",
    nameHe: "TÜV מקצועי",
    description: "19-page comprehensive report with full documentation",
    descriptionHe: "דו\"ח מקיף של 19 עמודים עם תיעוד מלא",
    pageCount: "19",
    icon: "🏆",
    supportsBilingual: true,
    requiresApproval: true,
    features: [
      "Document control",
      "Revision tracking",
      "DAC curves",
      "Calibration diagrams",
      "Multi-level approval",
      "Digital signatures"
    ],
    sections: [
      { id: "cover", name: "Cover Page", nameHe: "עמוד שער", required: true, order: 1, pages: 1, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "toc", name: "Table of Contents", nameHe: "תוכן עניינים", required: true, order: 2, pages: 1, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "revision", name: "Revision History", nameHe: "היסטוריית גרסאות", required: true, order: 3, pages: 1, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "scope", name: "Scope & References", nameHe: "היקף והפניות", required: true, order: 4, pages: 1, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "partInfo", name: "Part Information", nameHe: "פרטי חלק", required: true, order: 5, pages: 2, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "equipment", name: "Equipment", nameHe: "ציוד", required: true, order: 6, pages: 2, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "calibration", name: "Calibration", nameHe: "כיול", required: true, order: 7, pages: 2, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "refStandards", name: "Reference Standards", nameHe: "תקני ייחוס", required: true, order: 8, pages: 1, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "procedures", name: "Inspection Procedures", nameHe: "נהלי בדיקה", required: true, order: 9, pages: 2, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "scanPlan", name: "Scan Plan & Coverage", nameHe: "תכנית סריקה וכיסוי", required: true, order: 10, pages: 2, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "acceptance", name: "Acceptance Criteria", nameHe: "קריטריונים לקבלה", required: true, order: 11, pages: 1, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "results", name: "Inspection Results", nameHe: "תוצאות בדיקה", required: false, order: 12, pages: 2, includeInPreInspection: false, includeInPostInspection: true, includeInFull: true },
      { id: "signatures", name: "Approval & Signatures", nameHe: "אישורים וחתימות", required: true, order: 13, pages: 1, includeInPreInspection: false, includeInPostInspection: true, includeInFull: true },
    ]
  },
  {
    id: "chw",
    name: "CHW Forge Style",
    nameHe: "CHW Forge",
    description: "8-12 page compact professional report",
    descriptionHe: "דו\"ח מקצועי קומפקטי של 8-12 עמודים",
    pageCount: "8-12",
    icon: "⚡",
    supportsBilingual: false,
    requiresApproval: false,
    features: [
      "Compact layout",
      "Combined sections",
      "Visual scan plans",
      "Simplified approval"
    ],
    sections: [
      { id: "cover", name: "Cover & Summary", nameHe: "שער וסיכום", required: true, order: 1, pages: 1, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "partEquip", name: "Part & Equipment", nameHe: "חלק וציוד", required: true, order: 2, pages: 2, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "calibration", name: "Calibration Setup", nameHe: "הגדרת כיול", required: true, order: 3, pages: 2, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "procedures", name: "Procedures", nameHe: "נהלים", required: true, order: 4, pages: 2, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "results", name: "Results & Conclusions", nameHe: "תוצאות ומסקנות", required: false, order: 5, pages: 2, includeInPreInspection: false, includeInPostInspection: true, includeInFull: true },
      { id: "approval", name: "Approval", nameHe: "אישור", required: true, order: 6, pages: 1, includeInPreInspection: false, includeInPostInspection: true, includeInFull: true },
    ]
  },
  {
    id: "iai",
    name: "IAI Standard",
    nameHe: "תעשייה אווירית",
    description: "10-15 page bilingual report (Hebrew/English)",
    descriptionHe: "דו\"ח דו-לשוני של 10-15 עמודים",
    pageCount: "10-15",
    icon: "✈️",
    supportsBilingual: true,
    requiresApproval: true,
    features: [
      "Hebrew/English bilingual",
      "Detailed procedures",
      "Reference blocks",
      "Coverage tables",
      "IAI standard format"
    ],
    sections: [
      { id: "cover", name: "Cover Page", nameHe: "עמוד שער", required: true, order: 1, pages: 1, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "partInfo", name: "Part Details", nameHe: "פרטי חלק", required: true, order: 2, pages: 2, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "equipment", name: "Equipment List", nameHe: "רשימת ציוד", required: true, order: 3, pages: 2, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "calibration", name: "Calibration Data", nameHe: "נתוני כיול", required: true, order: 4, pages: 2, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "procedures", name: "Test Procedures", nameHe: "נהלי בדיקה", required: true, order: 5, pages: 3, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "coverage", name: "Coverage Table", nameHe: "טבלת כיסוי", required: true, order: 6, pages: 1, includeInPreInspection: true, includeInPostInspection: true, includeInFull: true },
      { id: "results", name: "Test Results", nameHe: "תוצאות בדיקה", required: false, order: 7, pages: 2, includeInPreInspection: false, includeInPostInspection: true, includeInFull: true },
      { id: "approval", name: "Signatures", nameHe: "חתימות", required: true, order: 8, pages: 1, includeInPreInspection: false, includeInPostInspection: true, includeInFull: true },
    ]
  },
  {
    id: "custom",
    name: "Custom Template",
    nameHe: "תבנית מותאמת",
    description: "Customize your export format",
    descriptionHe: "התאם את תבנית הייצוא",
    pageCount: "Variable",
    icon: "⚙️",
    supportsBilingual: true,
    requiresApproval: false,
    features: [
      "Select sections",
      "Custom branding",
      "Flexible layout",
      "Choose language"
    ],
    sections: [] // מוגדר ע"י המשתמש
  }
];

// === שלב הבדיקה ===

export type InspectionPhase = "pre-inspection" | "post-inspection" | "complete";

export interface ExportContext {
  phase: InspectionPhase;
  template: ExportTemplate;
  language: "en" | "he" | "both";
  includeImages: boolean;
  includeTables: boolean;
  includeCharts: boolean;
  watermark?: string;
  customSections?: string[];
}

// === פונקציות מיפוי נתונים ===

/**
 * ממפה נתונים מהמבנה הישן (Technique + Report) למבנה המאוחד
 */
export function mapLegacyDataToUnified(
  inspectionSetup: InspectionSetupData,
  equipment: EquipmentData,
  calibration: CalibrationData,
  scanParameters: ScanParametersData,
  acceptanceCriteria: AcceptanceCriteriaData,
  documentation: TechniqueDocumentationData,
  inspectionReport: InspectionReportData,
  scanDetails?: ScanDetailsData
): Partial<UnifiedInspectionData> {
  return {
    project: mapToProjectSetup(inspectionSetup, inspectionReport),
    equipment: mapToEquipmentCalibration(equipment, calibration, inspectionReport),
    scanPlan: mapToScanPlanning(scanDetails, scanParameters),
    procedures: mapToProceduresStandards(scanParameters, acceptanceCriteria),
    results: mapToResults(inspectionReport),
    documentation: mapToDocumentation(documentation, inspectionReport),
  };
}

function mapToProjectSetup(
  setup: InspectionSetupData, 
  report: InspectionReportData
): ProjectSetupData {
  return {
    // Customer Info (from report)
    customerName: report.customerName || "",
    customerPO: report.poNumber || "",
    customerContact: "",
    customerEmail: "",
    customerPhone: "",
    
    // Part Info (from setup)
    partNumber: setup.partNumber || report.poSerialNumber || "",
    partName: setup.partName || report.itemDescription || "",
    partSerialNumber: report.sampleSerialNo || "",
    partDescription: report.itemDescription || "",
    partType: setup.partType || "",
    drawingNumber: "",
    revisionNumber: report.currentRevision || "",
    
    // Material
    material: setup.material || report.materialGrade || "",
    materialSpec: setup.materialSpec || "",
    materialGrade: report.materialGrade || "",
    heatTreatment: "",
    surfaceCondition: "",
    
    // Dimensions
    partThickness: setup.partThickness || parseFloat(report.thickness) || 0,
    partLength: setup.partLength || 0,
    partWidth: setup.partWidth || 0,
    diameter: setup.diameter,
    innerDiameter: setup.innerDiameter,
    wallThickness: setup.wallThickness,
    isHollow: setup.isHollow,
    innerLength: setup.innerLength,
    innerWidth: setup.innerWidth,
    
    // Document Control
    documentNumber: report.documentNo || "",
    documentRevision: report.currentRevision || "0",
    documentDate: report.revisionDate || new Date().toISOString().split("T")[0],
    controlledCopy: false,
    copyNumber: "",
  };
}

function mapToEquipmentCalibration(
  equipment: EquipmentData,
  calibration: CalibrationData,
  report: InspectionReportData
): EquipmentCalibrationData {
  return {
    manufacturer: equipment.manufacturer || "",
    model: equipment.model || "",
    serialNumber: equipment.serialNumber || "",
    calibrationDueDate: calibration.lastCalibrationDate || "",
    
    probes: report.probeDetails?.map((probe, index) => ({
      id: `probe-${index}`,
      type: probe.probeDescription || equipment.transducerType || "",
      frequency: parseFloat(probe.frequency) || parseFloat(equipment.frequency) || 5,
      diameter: equipment.transducerDiameter || 0.5,
      angle: undefined,
      serialNumber: "",
      manufacturer: probe.make || "",
      couplant: equipment.couplant || "",
      mode: "PE" as const,
    })) || [{
      id: "probe-1",
      type: equipment.transducerType || "",
      frequency: parseFloat(equipment.frequency) || 5,
      diameter: equipment.transducerDiameter || 0.5,
      serialNumber: "",
      manufacturer: "",
      couplant: equipment.couplant || "",
      mode: "PE" as const,
    }],
    
    calibrationBlocks: [{
      id: "cal-block-1",
      name: calibration.standardType || "Reference Block",
      type: calibration.standardType || "",
      material: calibration.referenceMaterial || "",
      thickness: calibration.metalTravelDistance || 0,
      serialNumber: calibration.blockSerialNumber || "",
      standard: "",
      features: [],
    }],
    
    dacCurves: [],
    referenceStandards: [],
    transferCorrection: {
      method: "",
      correctionValue: 0,
      verificationBlock: "",
    },
  };
}

function mapToScanPlanning(
  scanDetails: ScanDetailsData | undefined,
  scanParams: ScanParametersData
): ScanPlanningData {
  return {
    drawingData: {
      partViews: [],
      scanOverlays: [],
      dimensionAnnotations: [],
      legendData: { scanTypes: [], symbols: [] },
    },
    scanDirections: [], // Will be populated from actual scan directions if available
    coverage: {
      method: scanParams.scanPattern || "",
      totalArea: 0,
      coveredArea: 0,
      coveragePercentage: scanParams.coverage || 100,
      criticalZones: [],
    },
    scanSpeed: scanParams.scanSpeed || 0,
    scanIndex: scanParams.scanIndex || 0,
    overlapPercentage: 15, // Default overlap
  };
}

function mapToProceduresStandards(
  scanParams: ScanParametersData,
  acceptance: AcceptanceCriteriaData
): ProceduresStandardsData {
  return {
    surfacePrep: {
      method: "",
      roughnessRequirement: "",
      cleaningMethod: "",
      couplantType: "",
      temperatureRange: "",
    },
    procedures: [],
    acceptanceCriteria: {
      acceptanceClass: acceptance.acceptanceClass || "",
      standard: "",
      evaluationLevel: 0,
      recordingLevel: 0,
      acceptanceLevel: 0,
      indications: [],
    },
    applicableStandards: [],
    transferProcedures: [],
  };
}

function mapToResults(report: InspectionReportData): ResultsData {
  return {
    scanResults: report.scans?.map((scan, index) => ({
      scanId: `scan-${index}`,
      location: scan.direction || "",
      probeUsed: scan.probeType || "",
      gain: typeof scan.gain === 'string' ? parseFloat(scan.gain) || 0 : 0,
      indications: 0,
      status: "Accept" as const,
      comments: "",
    })) || [],
    indications: [],
    dataForms: [],
    statistics: {
      totalScans: report.scans?.length || 0,
      acceptedScans: 0,
      rejectedScans: 0,
      indicationsFound: 0,
      criticalFindings: 0,
      charts: [],
    },
  };
}

function mapToDocumentation(
  techDoc: TechniqueDocumentationData,
  report: InspectionReportData
): DocumentationData {
  return {
    personnel: {
      inspector: {
        name: techDoc.inspectorName || report.approvedBy || "",
        certification: techDoc.inspectorCertification || "",
        level: techDoc.inspectorLevel || "",
        date: techDoc.inspectionDate || "",
        company: techDoc.certifyingOrganization || "",
      },
      reviewer: undefined,
      approver: report.approvedBy ? {
        name: report.approvedBy,
        certification: "",
        level: "",
        date: "",
        company: "",
      } : undefined,
    },
    procedures: techDoc.procedureNumber ? [techDoc.procedureNumber] : [],
    notes: techDoc.additionalNotes || "",
    remarks: report.remarks?.map((remark, index) => ({
      id: `remark-${index}`,
      category: "general",
      text: typeof remark === 'string' ? remark : "",
      addedBy: "",
      timestamp: new Date().toISOString(),
    })) || [],
    revisionHistory: [],
    attachments: [],
  };
}

// === זיהוי שלב הבדיקה ===

export function detectInspectionPhase(data: Partial<UnifiedInspectionData>): InspectionPhase {
  const hasResults = (data.results?.scanResults?.length ?? 0) > 0;
  const hasApproval = !!data.documentation?.personnel?.approver?.name;
  const hasIndications = (data.results?.indications?.length ?? 0) > 0;
  
  if (hasApproval && hasResults) {
    return "complete";
  } else if (hasResults || hasIndications) {
    return "post-inspection";
  }
  return "pre-inspection";
}

// === חישוב סעיפים לייצוא ===

export function getSectionsForExport(
  template: ExportTemplateConfig,
  phase: InspectionPhase,
  customSections?: string[]
): ExportSection[] {
  if (template.id === "custom" && customSections) {
    return template.sections.filter(s => customSections.includes(s.id));
  }
  
  return template.sections.filter(section => {
    switch (phase) {
      case "pre-inspection":
        return section.includeInPreInspection;
      case "post-inspection":
        return section.includeInPostInspection;
      case "complete":
        return section.includeInFull;
      default:
        return section.required;
    }
  }).sort((a, b) => a.order - b.order);
}

// === חישוב סטטיסטיקות ייצוא ===

export interface ExportStats {
  totalPages: number;
  sectionsIncluded: number;
  sectionsTotal: number;
  missingData: string[];
  readinessPercentage: number;
  phase: InspectionPhase;
  phaseLabel: string;
  phaseLabelHe: string;
}

export function calculateExportStats(
  data: Partial<UnifiedInspectionData>,
  template: ExportTemplateConfig,
  context: ExportContext
): ExportStats {
  const phase = detectInspectionPhase(data);
  const sections = getSectionsForExport(template, phase, context.customSections);
  
  const totalPages = sections.reduce((sum, s) => sum + s.pages, 0);
  const missingData: string[] = [];
  
  // בדיקת נתונים חסרים
  if (!data.project?.partNumber) missingData.push("Part Number");
  if (!data.project?.customerName) missingData.push("Customer Name");
  if (!data.equipment?.probes?.length) missingData.push("Probe Details");
  if (!data.equipment?.calibrationBlocks?.length) missingData.push("Calibration Block");
  
  if (phase !== "pre-inspection") {
    if (!data.results?.scanResults?.length) missingData.push("Scan Results");
    if (!data.documentation?.personnel?.inspector?.name) missingData.push("Inspector Name");
  }
  
  // חישוב אחוז מוכנות
  const totalRequiredFields = 10;
  const filledFields = totalRequiredFields - missingData.length;
  const readinessPercentage = Math.round((filledFields / totalRequiredFields) * 100);
  
  const phaseLabels: Record<InspectionPhase, { en: string; he: string }> = {
    "pre-inspection": { en: "Pre-Inspection", he: "לפני הבדיקה" },
    "post-inspection": { en: "Post-Inspection", he: "אחרי הבדיקה" },
    "complete": { en: "Complete Report", he: "דו\"ח מלא" },
  };
  
  return {
    totalPages,
    sectionsIncluded: sections.length,
    sectionsTotal: template.sections.length,
    missingData,
    readinessPercentage,
    phase,
    phaseLabel: phaseLabels[phase].en,
    phaseLabelHe: phaseLabels[phase].he,
  };
}

// === יצירת תצוגה מקדימה ===

export interface PreviewData {
  sections: {
    id: string;
    name: string;
    status: "ready" | "partial" | "pending";
    content: string;
  }[];
  summary: ExportStats;
}

export function generatePreview(
  data: Partial<UnifiedInspectionData>,
  template: ExportTemplateConfig,
  context: ExportContext
): PreviewData {
  const phase = detectInspectionPhase(data);
  const sections = getSectionsForExport(template, phase, context.customSections);
  const stats = calculateExportStats(data, template, context);
  
  return {
    sections: sections.map(section => ({
      id: section.id,
      name: context.language === "he" ? section.nameHe : section.name,
      status: getSectionStatus(section.id, data, phase),
      content: getSectionPreviewContent(section.id, data, context.language),
    })),
    summary: stats,
  };
}

function getSectionStatus(
  sectionId: string, 
  data: Partial<UnifiedInspectionData>,
  phase: InspectionPhase
): "ready" | "partial" | "pending" {
  switch (sectionId) {
    case "cover":
      return data.project?.partNumber ? "ready" : "partial";
    case "partInfo":
      return data.project?.partNumber && data.project?.material ? "ready" : "partial";
    case "equipment":
      return data.equipment?.probes?.length ? "ready" : "pending";
    case "calibration":
      return data.equipment?.calibrationBlocks?.length ? "ready" : "pending";
    case "results":
      return phase === "pre-inspection" ? "pending" : 
             data.results?.scanResults?.length ? "ready" : "partial";
    case "signatures":
      return data.documentation?.personnel?.inspector?.name ? "ready" : "pending";
    default:
      return "partial";
  }
}

function getSectionPreviewContent(
  sectionId: string,
  data: Partial<UnifiedInspectionData>,
  language: "en" | "he" | "both"
): string {
  const isHebrew = language === "he";
  
  switch (sectionId) {
    case "cover":
      return data.project?.partNumber 
        ? `${isHebrew ? "חלק" : "Part"}: ${data.project.partNumber}` 
        : isHebrew ? "ממתין למילוי..." : "Pending...";
    case "partInfo":
      return data.project?.material 
        ? `${isHebrew ? "חומר" : "Material"}: ${data.project.material}` 
        : isHebrew ? "ממתין..." : "Pending...";
    case "equipment":
      return data.equipment?.manufacturer 
        ? `${data.equipment.manufacturer} ${data.equipment.model}` 
        : isHebrew ? "לא הוגדר ציוד" : "No equipment defined";
    case "calibration":
      return data.equipment?.calibrationBlocks?.[0]?.name 
        || (isHebrew ? "לא הוגדר בלוק כיול" : "No calibration block defined");
    case "results": {
      const count = data.results?.scanResults?.length || 0;
      return count > 0 
        ? `${count} ${isHebrew ? "סריקות" : "scans"}` 
        : isHebrew ? "אין תוצאות עדיין" : "No results yet";
    }
    default:
      return "";
  }
}

// === ייצוא הראשי ===

export const unifiedExportService = {
  templates: EXPORT_TEMPLATES,
  mapLegacyData: mapLegacyDataToUnified,
  detectPhase: detectInspectionPhase,
  getSections: getSectionsForExport,
  calculateStats: calculateExportStats,
  generatePreview,
  
  getTemplate(id: ExportTemplate): ExportTemplateConfig | undefined {
    return EXPORT_TEMPLATES.find(t => t.id === id);
  },
  
  getDefaultContext(): ExportContext {
    return {
      phase: "pre-inspection",
      template: "tuv",
      language: "en",
      includeImages: true,
      includeTables: true,
      includeCharts: true,
    };
  },
};

export default unifiedExportService;
