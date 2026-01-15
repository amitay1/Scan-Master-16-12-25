/**
 * Multi-Part Batch Mode Types
 */

// Part data from import
export interface BatchPart {
  id: string;
  partNumber: string;
  serialNumber?: string;
  description?: string;
  material?: string;
  thickness?: number;
  length?: number;
  width?: number;
  outerDiameter?: number;
  innerDiameter?: number;
  quantity?: number;
  acceptanceClass?: string;
  customer?: string;
  poNumber?: string;
  [key: string]: string | number | undefined; // Allow custom fields
}

// Column mapping for CSV import
export interface ColumnMapping {
  csvColumn: string;
  targetField: keyof BatchPart | string;
  transform?: (value: string) => string | number;
}

// Batch template
export interface BatchTemplate {
  id: string;
  name: string;
  description?: string;
  baseData: Record<string, unknown>; // Base technique sheet data
  fieldMappings: Record<string, string>; // Map batch fields to technique sheet fields
  createdAt: string;
}

// Batch job status
export type BatchJobStatus = "pending" | "processing" | "completed" | "failed";

// Individual sheet status in batch
export interface BatchSheetResult {
  partId: string;
  partNumber: string;
  serialNumber?: string;
  status: BatchJobStatus;
  error?: string;
  outputPath?: string;
  techniqueSheetId?: string;
}

// Batch job
export interface BatchJob {
  id: string;
  templateId: string;
  templateName: string;
  status: BatchJobStatus;
  totalParts: number;
  completedParts: number;
  failedParts: number;
  results: BatchSheetResult[];
  startedAt: string;
  completedAt?: string;
  outputZipPath?: string;
}

// CSV parse result
export interface CSVParseResult {
  headers: string[];
  rows: string[][];
  errors: string[];
  rowCount: number;
}

// Import preview
export interface ImportPreview {
  parts: BatchPart[];
  unmappedColumns: string[];
  warnings: string[];
  isValid: boolean;
}

// Export options
export interface BatchExportOptions {
  format: "pdf" | "docx" | "both";
  naming: "part_number" | "serial_number" | "custom";
  namingPattern?: string; // e.g., "{part_number}_{serial_number}"
  includeIndex: boolean;
  zipOutput: boolean;
}

// Predefined column mappings for common CSV formats
export const COMMON_COLUMN_MAPPINGS: Record<string, ColumnMapping[]> = {
  standard: [
    { csvColumn: "Part Number", targetField: "partNumber" },
    { csvColumn: "Serial Number", targetField: "serialNumber" },
    { csvColumn: "Description", targetField: "description" },
    { csvColumn: "Material", targetField: "material" },
    { csvColumn: "Thickness", targetField: "thickness", transform: parseFloat },
    { csvColumn: "Length", targetField: "length", transform: parseFloat },
    { csvColumn: "Width", targetField: "width", transform: parseFloat },
    { csvColumn: "Class", targetField: "acceptanceClass" },
  ],
  aerospace: [
    { csvColumn: "P/N", targetField: "partNumber" },
    { csvColumn: "S/N", targetField: "serialNumber" },
    { csvColumn: "CAGE", targetField: "customer" },
    { csvColumn: "PO", targetField: "poNumber" },
    { csvColumn: "Alloy", targetField: "material" },
    { csvColumn: "THK", targetField: "thickness", transform: parseFloat },
    { csvColumn: "LEN", targetField: "length", transform: parseFloat },
    { csvColumn: "WID", targetField: "width", transform: parseFloat },
    { csvColumn: "OD", targetField: "outerDiameter", transform: parseFloat },
    { csvColumn: "ID", targetField: "innerDiameter", transform: parseFloat },
    { csvColumn: "QTY", targetField: "quantity", transform: parseInt },
    { csvColumn: "ACC CLASS", targetField: "acceptanceClass" },
  ],
};

// Batch field descriptions for UI
export const BATCH_FIELD_DESCRIPTIONS: Record<string, string> = {
  partNumber: "Unique part identifier (required)",
  serialNumber: "Individual serial number",
  description: "Part description",
  material: "Material type (e.g., Ti-6Al-4V, 7075-T6)",
  thickness: "Part thickness in mm",
  length: "Part length in mm",
  width: "Part width in mm",
  outerDiameter: "Outer diameter for cylindrical parts",
  innerDiameter: "Inner diameter for tubular parts",
  quantity: "Number of parts with this specification",
  acceptanceClass: "Acceptance class (AAA, AA, A, B, C)",
  customer: "Customer or CAGE code",
  poNumber: "Purchase order number",
};
