import { PDFExporter } from "./pdfExporter";
import { WordExporter } from "./wordExporter";
import { TuvStyleExporter } from "./tuvStyleExporter";
import { BaseExporter } from "./baseExporter";
import {
  ExportData,
  ExportOptions,
  ExportFormat,
  ExportResult,
  ExportTemplate,
  defaultColorScheme,
} from "@/types/exportTypes";
import type {
  StandardType,
  InspectionSetupData,
  EquipmentData,
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  DocumentationData,
} from "@/types/techniqueSheet";

export class ExportManager {
  private exporters: Map<ExportFormat, typeof BaseExporter> = new Map();

  constructor() {
    this.registerExporter("pdf", PDFExporter);
    this.registerExporter("word", WordExporter);
  }

  private registerExporter(format: ExportFormat, exporterClass: typeof BaseExporter): void {
    this.exporters.set(format, exporterClass);
  }

  async export(
    format: ExportFormat,
    data: ExportData,
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> {
    // Use TÜV exporter for TÜV template regardless of format
    let ExporterClass: typeof BaseExporter;
    
    if (options.template === "tuv") {
      ExporterClass = TuvStyleExporter;
    } else {
      ExporterClass = this.exporters.get(format) || PDFExporter;
    }
    
    if (!ExporterClass) {
      return {
        success: false,
        error: `Unsupported export format: ${format}`,
      };
    }

    const fullOptions: ExportOptions = {
      format,
      template: options.template || "standard",
      includeWatermark: options.includeWatermark ?? false,
      companyLogo: options.companyLogo,
      companyName: options.companyName,
      companyAddress: options.companyAddress,
      includeTableOfContents: options.includeTableOfContents ?? false,
      includePageNumbers: options.includePageNumbers ?? true,
      colorScheme: options.colorScheme || defaultColorScheme,
      customHeader: options.customHeader,
      customFooter: options.customFooter,
      filename: options.filename,
      // TÜV-specific options
      documentNumber: options.documentNumber,
      revisionNumber: options.revisionNumber,
      revisionDate: options.revisionDate,
      revisionDescription: options.revisionDescription,
      language: options.language,
      certificationLevel: options.certificationLevel,
      inspectorCertification: options.inspectorCertification,
      controlledCopy: options.controlledCopy,
    };

    try {
      const exporter = new (ExporterClass as any)(data, fullOptions);
      return await exporter.export();
    } catch (error) {
      console.error(`Export error for format ${format}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Export failed",
      };
    }
  }

  async exportTechniqueSheet(
    format: ExportFormat,
    standard: StandardType,
    inspectionSetup: InspectionSetupData,
    equipment: EquipmentData,
    calibration: CalibrationData,
    scanParameters: ScanParametersData,
    acceptanceCriteria: AcceptanceCriteriaData,
    documentation: DocumentationData,
    options: Partial<ExportOptions> = {}
  ): Promise<ExportResult> {
    const exportData: ExportData = {
      standard,
      inspectionSetup,
      equipment,
      calibration,
      scanParameters,
      acceptanceCriteria,
      documentation,
    };

    return this.export(format, exportData, options);
  }

  getSupportedFormats(): ExportFormat[] {
    return Array.from(this.exporters.keys());
  }

  isFormatSupported(format: ExportFormat): boolean {
    return this.exporters.has(format);
  }

  getDefaultOptions(template: ExportTemplate = "standard"): ExportOptions {
    return {
      format: "pdf",
      template,
      includeWatermark: false,
      includeTableOfContents: template === "comprehensive",
      includePageNumbers: true,
      colorScheme: defaultColorScheme,
    };
  }

  async exportWithProgress(
    format: ExportFormat,
    data: ExportData,
    options: Partial<ExportOptions> = {},
    onProgress?: (progress: number, message: string) => void
  ): Promise<ExportResult> {
    try {
      // Simulate progress for user feedback
      onProgress?.(0, "Initializing export...");
      
      onProgress?.(20, "Preparing document structure...");
      
      onProgress?.(40, "Processing data...");
      
      onProgress?.(60, "Generating content...");
      
      const result = await this.export(format, data, options);
      
      onProgress?.(100, "Export complete!");
      
      return result;
    } catch (error) {
      onProgress?.(0, "Export failed");
      throw error;
    }
  }
}

// Singleton instance
export const exportManager = new ExportManager();