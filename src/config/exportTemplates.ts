import { ExportTemplate } from "@/types/exportTypes";

export interface TemplateConfiguration {
  id: ExportTemplate;
  name: string;
  description: string;
  estimatedPages: string;
  sections: {
    coverPage: boolean;
    tableOfContents: boolean;
    inspectionSetup: boolean;
    equipment: boolean;
    calibration: boolean;
    calibrationDiagram: boolean;
    scanParameters: boolean;
    acceptanceCriteria: boolean;
    partDiagram: boolean;
    documentation: boolean;
    scanImages: boolean;
    approvals: boolean;
  };
  features: string[];
  bestFor: string;
}

export const exportTemplates: Record<ExportTemplate, TemplateConfiguration> = {
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Essential information only - perfect for quick reference",
    estimatedPages: "1-2 pages",
    sections: {
      coverPage: false,
      tableOfContents: false,
      inspectionSetup: true,
      equipment: true,
      calibration: true,
      calibrationDiagram: false,
      scanParameters: true,
      acceptanceCriteria: true,
      partDiagram: false,
      documentation: true,
      scanImages: false,
      approvals: false,
    },
    features: [
      "Compact single or two-page format",
      "Essential parameters only",
      "Quick reference data",
      "Basic documentation",
    ],
    bestFor: "Internal use, quick reference, preliminary reviews",
  },
  standard: {
    id: "standard",
    name: "Standard",
    description: "Comprehensive technical documentation with diagrams",
    estimatedPages: "3-5 pages",
    sections: {
      coverPage: true,
      tableOfContents: false,
      inspectionSetup: true,
      equipment: true,
      calibration: true,
      calibrationDiagram: true,
      scanParameters: true,
      acceptanceCriteria: true,
      partDiagram: true,
      documentation: true,
      scanImages: false,
      approvals: true,
    },
    features: [
      "Professional cover page",
      "Calibration block diagrams",
      "Part diagrams and technical drawings",
      "Approval signature section",
      "Complete technical specifications",
    ],
    bestFor: "Client submissions, official documentation, audit records",
  },
  comprehensive: {
    id: "comprehensive",
    name: "Comprehensive",
    description: "Full inspection report with all supporting documentation",
    estimatedPages: "6+ pages",
    sections: {
      coverPage: true,
      tableOfContents: true,
      inspectionSetup: true,
      equipment: true,
      calibration: true,
      calibrationDiagram: true,
      scanParameters: true,
      acceptanceCriteria: true,
      partDiagram: true,
      documentation: true,
      scanImages: true,
      approvals: true,
    },
    features: [
      "Table of contents",
      "All technical diagrams",
      "Scan images and results",
      "Complete calibration documentation",
      "Multi-page detailed report",
      "Full traceability information",
    ],
    bestFor: "Critical inspections, regulatory compliance, complete project documentation",
  },
};

export function getTemplateConfig(template: ExportTemplate): TemplateConfiguration {
  return exportTemplates[template];
}

export function getTemplateSections(template: ExportTemplate): string[] {
  const config = exportTemplates[template];
  return Object.entries(config.sections)
    .filter(([_, included]) => included)
    .map(([section]) => section);
}

export function estimatePageCount(template: ExportTemplate, hasScanImages: boolean = false): number {
  switch (template) {
    case "minimal":
      return 2;
    case "standard":
      return 4;
    case "comprehensive":
      return hasScanImages ? 8 : 6;
    default:
      return 3;
  }
}