/**
 * Export Manager - Centralized export handling
 * Now uses the new TechniqueSheetPDF exporter
 */

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
import { exportTechniqueSheetPDF } from "@/utils/export/TechniqueSheetPDF";

export class ExportManager {
  private exporters: Map<ExportFormat, typeof BaseExporter> = new Map();

  constructor() {
    // Word and TUV exporters still use the old system
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
    // PDF uses the new exporter
    if (format === "pdf" && options.template !== "tuv") {
      try {
        exportTechniqueSheetPDF({
          standard: data.standard,
          inspectionSetup: data.inspectionSetup,
          equipment: data.equipment,
          calibration: data.calibration,
          scanParameters: data.scanParameters,
          acceptanceCriteria: data.acceptanceCriteria,
          documentation: data.documentation,
        }, {
          companyName: options.companyName,
          companyLogo: options.companyLogo,
          documentNumber: options.documentNumber,
        });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "PDF export failed",
        };
      }
    }

    // Use TÜV exporter for TÜV template
    let ExporterClass: typeof BaseExporter | undefined;

    if (options.template === "tuv") {
      ExporterClass = TuvStyleExporter;
    } else {
      ExporterClass = this.exporters.get(format);
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
      const exporter = new (ExporterClass as unknown as new (data: ExportData, options: ExportOptions) => BaseExporter)(data, fullOptions);
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
    return ["pdf", "word"];
  }

  isFormatSupported(format: ExportFormat): boolean {
    return format === "pdf" || this.exporters.has(format);
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
