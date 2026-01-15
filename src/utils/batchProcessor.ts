/**
 * Batch Processor
 * Handles CSV parsing, validation, and batch generation
 */

import type {
  BatchPart,
  ColumnMapping,
  CSVParseResult,
  ImportPreview,
  BatchJob,
  BatchSheetResult,
  BatchExportOptions,
} from "@/types/batch";
import { BATCH_FIELD_DESCRIPTIONS } from "@/types/batch";

/**
 * Parse CSV text into rows and columns
 */
export function parseCSV(csvText: string): CSVParseResult {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
  const errors: string[] = [];

  if (lines.length === 0) {
    return { headers: [], rows: [], errors: ["Empty file"], rowCount: 0 };
  }

  // Parse headers
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    try {
      const row = parseCSVLine(lines[i]);
      if (row.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${row.length})`);
      }
      rows.push(row);
    } catch (err) {
      errors.push(`Row ${i + 1}: Parse error - ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return {
    headers,
    rows,
    errors,
    rowCount: rows.length,
  };
}

/**
 * Parse a single CSV line, handling quotes
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Auto-detect column mappings based on header names
 */
export function autoDetectMappings(headers: string[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];

  const headerPatterns: Record<string, RegExp[]> = {
    partNumber: [/part.*num/i, /p\/n/i, /pn/i, /part.*no/i],
    serialNumber: [/serial/i, /s\/n/i, /sn/i],
    description: [/desc/i, /name/i],
    material: [/material/i, /alloy/i, /mat/i],
    thickness: [/thick/i, /thk/i, /t$/i],
    length: [/length/i, /len/i, /l$/i],
    width: [/width/i, /wid/i, /w$/i],
    outerDiameter: [/outer.*dia/i, /od/i],
    innerDiameter: [/inner.*dia/i, /id/i],
    quantity: [/qty/i, /quantity/i],
    acceptanceClass: [/class/i, /acc.*class/i],
    customer: [/customer/i, /cage/i],
    poNumber: [/po/i, /purchase/i, /order/i],
  };

  for (const header of headers) {
    let mapped = false;

    for (const [field, patterns] of Object.entries(headerPatterns)) {
      if (patterns.some((pattern) => pattern.test(header))) {
        mappings.push({
          csvColumn: header,
          targetField: field,
          transform: ["thickness", "length", "width", "outerDiameter", "innerDiameter"].includes(field)
            ? parseFloat
            : field === "quantity"
            ? parseInt
            : undefined,
        });
        mapped = true;
        break;
      }
    }

    if (!mapped) {
      // Keep unmapped columns for user to handle
      mappings.push({
        csvColumn: header,
        targetField: "",
      });
    }
  }

  return mappings;
}

/**
 * Apply column mappings to parsed CSV data
 */
export function applyMappings(
  csvResult: CSVParseResult,
  mappings: ColumnMapping[]
): ImportPreview {
  const parts: BatchPart[] = [];
  const warnings: string[] = [];
  const unmappedColumns: string[] = [];

  // Find unmapped columns
  for (const mapping of mappings) {
    if (!mapping.targetField) {
      unmappedColumns.push(mapping.csvColumn);
    }
  }

  // Process each row
  for (let i = 0; i < csvResult.rows.length; i++) {
    const row = csvResult.rows[i];
    const part: BatchPart = {
      id: `part-${i + 1}`,
      partNumber: "",
    };

    for (let j = 0; j < csvResult.headers.length; j++) {
      const header = csvResult.headers[j];
      const value = row[j];
      const mapping = mappings.find((m) => m.csvColumn === header);

      if (mapping && mapping.targetField) {
        const transformedValue = mapping.transform ? mapping.transform(value) : value;

        // Handle NaN from parseFloat/parseInt
        if (typeof transformedValue === "number" && isNaN(transformedValue)) {
          warnings.push(`Row ${i + 2}: Invalid number for ${mapping.targetField}`);
          continue;
        }

        (part as Record<string, unknown>)[mapping.targetField] = transformedValue;
      }
    }

    // Validate required fields
    if (!part.partNumber) {
      warnings.push(`Row ${i + 2}: Missing part number`);
    }

    parts.push(part);
  }

  // Check for duplicate part numbers
  const partNumbers = parts.map((p) => p.partNumber);
  const duplicates = partNumbers.filter((pn, i) => partNumbers.indexOf(pn) !== i);
  if (duplicates.length > 0) {
    warnings.push(`Duplicate part numbers found: ${[...new Set(duplicates)].join(", ")}`);
  }

  return {
    parts,
    unmappedColumns,
    warnings,
    isValid: parts.every((p) => p.partNumber) && warnings.filter((w) => w.includes("Missing")).length === 0,
  };
}

/**
 * Validate batch parts
 */
export function validateBatchParts(parts: BatchPart[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const rowNum = i + 1;

    if (!part.partNumber) {
      errors.push(`Part ${rowNum}: Part number is required`);
    }

    if (part.thickness !== undefined && (part.thickness <= 0 || part.thickness > 1000)) {
      errors.push(`Part ${rowNum}: Invalid thickness value`);
    }

    if (part.length !== undefined && (part.length <= 0 || part.length > 10000)) {
      errors.push(`Part ${rowNum}: Invalid length value`);
    }

    if (part.innerDiameter !== undefined && part.outerDiameter !== undefined) {
      if (part.innerDiameter >= part.outerDiameter) {
        errors.push(`Part ${rowNum}: Inner diameter must be less than outer diameter`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate filename for exported sheet
 */
export function generateFilename(
  part: BatchPart,
  options: BatchExportOptions,
  index: number
): string {
  let name: string;

  switch (options.naming) {
    case "part_number":
      name = sanitizeFilename(part.partNumber);
      break;
    case "serial_number":
      name = sanitizeFilename(part.serialNumber || part.partNumber);
      break;
    case "custom":
      name = options.namingPattern
        ? options.namingPattern
            .replace("{part_number}", part.partNumber)
            .replace("{serial_number}", part.serialNumber || "")
            .replace("{index}", String(index + 1).padStart(3, "0"))
            .replace("{material}", part.material || "")
        : part.partNumber;
      name = sanitizeFilename(name);
      break;
    default:
      name = sanitizeFilename(part.partNumber);
  }

  if (options.includeIndex) {
    name = `${String(index + 1).padStart(3, "0")}_${name}`;
  }

  return name;
}

/**
 * Sanitize string for use as filename
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .trim()
    .substring(0, 100);
}

/**
 * Create a new batch job
 */
export function createBatchJob(
  templateId: string,
  templateName: string,
  parts: BatchPart[]
): BatchJob {
  return {
    id: `batch-${Date.now().toString(36)}`,
    templateId,
    templateName,
    status: "pending",
    totalParts: parts.length,
    completedParts: 0,
    failedParts: 0,
    results: parts.map((part) => ({
      partId: part.id,
      partNumber: part.partNumber,
      serialNumber: part.serialNumber,
      status: "pending",
    })),
    startedAt: new Date().toISOString(),
  };
}

/**
 * Update batch job result for a part
 */
export function updateBatchJobResult(
  job: BatchJob,
  partId: string,
  result: Partial<BatchSheetResult>
): BatchJob {
  const updatedResults = job.results.map((r) =>
    r.partId === partId ? { ...r, ...result } : r
  );

  const completedParts = updatedResults.filter((r) => r.status === "completed").length;
  const failedParts = updatedResults.filter((r) => r.status === "failed").length;
  const allDone = completedParts + failedParts === job.totalParts;

  return {
    ...job,
    status: allDone ? (failedParts === 0 ? "completed" : "failed") : "processing",
    completedParts,
    failedParts,
    results: updatedResults,
    completedAt: allDone ? new Date().toISOString() : undefined,
  };
}

/**
 * Merge batch part data with template data
 */
export function mergePartWithTemplate(
  part: BatchPart,
  templateData: Record<string, unknown>,
  fieldMappings: Record<string, string>
): Record<string, unknown> {
  const merged = { ...templateData };

  for (const [batchField, templateField] of Object.entries(fieldMappings)) {
    if (part[batchField] !== undefined) {
      // Handle nested paths like "part.dimensions.thickness"
      const path = templateField.split(".");
      let current = merged;

      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]] as Record<string, unknown>;
      }

      current[path[path.length - 1]] = part[batchField];
    }
  }

  return merged;
}

/**
 * Get sample CSV content for download
 */
export function getSampleCSV(): string {
  return `Part Number,Serial Number,Description,Material,Thickness,Length,Width,Class
ABC-001,SN-001,"Forging Block, Titanium",Ti-6Al-4V,25.4,100,50,A
ABC-002,SN-002,"Forging Block, Titanium",Ti-6Al-4V,25.4,100,50,A
ABC-003,SN-003,"Plate, Aluminum",7075-T6,12.7,200,150,B
DEF-001,SN-004,"Cylinder, Steel",4340,50.8,300,,AA`;
}

/**
 * Get list of mappable fields with descriptions
 */
export function getMappableFields(): { field: string; description: string }[] {
  return Object.entries(BATCH_FIELD_DESCRIPTIONS).map(([field, description]) => ({
    field,
    description,
  }));
}
