import { ExportData, ExportOptions, ExportResult, ExportTemplate } from "@/types/exportTypes";

export abstract class BaseExporter {
  protected data: ExportData;
  protected options: ExportOptions;
  protected template: ExportTemplate;

  constructor(data: ExportData, options: ExportOptions) {
    this.data = data;
    this.options = options;
    this.template = options.template || "standard";
  }

  abstract export(): Promise<ExportResult>;

  protected abstract renderCoverPage(): void;
  protected abstract renderTableOfContents(): void;
  protected abstract renderInspectionSetup(): void;
  protected abstract renderEquipment(): void;
  protected abstract renderCalibration(): void;
  protected abstract renderCalibrationDiagram(): void;
  protected abstract renderScanParameters(): void;
  protected abstract renderAcceptanceCriteria(): void;
  protected abstract renderPartDiagram(): void;
  protected abstract renderDocumentation(): void;
  protected abstract renderScanImages(): void;
  protected abstract renderApprovals(): void;
  protected abstract addPageNumbers(): void;
  protected abstract addWatermark(): void;

  protected getFileName(): string {
    const defaultName = `UT_Technique_Sheet_${this.data.inspectionSetup.partNumber || 'Unknown'}_${new Date().toISOString().split('T')[0]}`;
    return this.options.filename || defaultName;
  }

  protected shouldIncludeSection(sectionId: string): boolean {
    const sections = {
      coverPage: {
        minimal: false,
        standard: true,
        comprehensive: true,
      },
      tableOfContents: {
        minimal: false,
        standard: false,
        comprehensive: true,
      },
      inspectionSetup: {
        minimal: true,
        standard: true,
        comprehensive: true,
      },
      equipment: {
        minimal: true,
        standard: true,
        comprehensive: true,
      },
      calibration: {
        minimal: true,
        standard: true,
        comprehensive: true,
      },
      calibrationDiagram: {
        minimal: false,
        standard: true,
        comprehensive: true,
      },
      scanParameters: {
        minimal: true,
        standard: true,
        comprehensive: true,
      },
      acceptanceCriteria: {
        minimal: true,
        standard: true,
        comprehensive: true,
      },
      partDiagram: {
        minimal: false,
        standard: true,
        comprehensive: true,
      },
      documentation: {
        minimal: true,
        standard: true,
        comprehensive: true,
      },
      scanImages: {
        minimal: false,
        standard: false,
        comprehensive: true,
      },
      approvals: {
        minimal: false,
        standard: true,
        comprehensive: true,
      },
    };

    return sections[sectionId]?.[this.template] ?? false;
  }

  protected formatDate(date?: string): string {
    if (!date) return new Date().toLocaleDateString();
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return date;
    }
  }

  protected formatValue(value: any, suffix = ""): string {
    if (value === null || value === undefined || value === "") {
      return "N/A";
    }
    return suffix ? `${value} ${suffix}` : value.toString();
  }

  protected getColorValue(colorKey: keyof typeof this.options.colorScheme): string {
    return this.options.colorScheme?.[colorKey] || "#000000";
  }

  protected hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }
}