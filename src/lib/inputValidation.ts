import { z } from 'zod';

// UUID validation schema
export const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

// Standard code validation (alphanumeric with dashes, max 50 chars)
export const standardCodeSchema = z
  .string()
  .trim()
  .min(1, { message: 'Standard code is required' })
  .max(50, { message: 'Standard code must be less than 50 characters' })
  .regex(/^[A-Za-z0-9\-]+$/, { message: 'Standard code contains invalid characters' });

// Price type validation
export const priceTypeSchema = z.enum(['one_time', 'monthly', 'annual'], {
  errorMap: () => ({ message: 'Invalid price type. Must be one_time, monthly, or annual' }),
});

// Helper to validate UUID
export function validateUUID(value: unknown): { valid: boolean; error?: string } {
  const result = uuidSchema.safeParse(value);
  if (!result.success) {
    return { valid: false, error: result.error.errors[0].message };
  }
  return { valid: true };
}

// Helper to validate standard code
export function validateStandardCode(value: unknown): { valid: boolean; error?: string } {
  const result = standardCodeSchema.safeParse(value);
  if (!result.success) {
    return { valid: false, error: result.error.errors[0].message };
  }
  return { valid: true };
}

// Helper to validate price type
export function validatePriceType(value: unknown): { valid: boolean; error?: string } {
  const result = priceTypeSchema.safeParse(value);
  if (!result.success) {
    return { valid: false, error: result.error.errors[0].message };
  }
  return { valid: true };
}

// Technique sheet data validation
export const techniqueSheetDataSchema = z.object({
  standardName: z.string().optional(),
  inspectionSetup: z.object({
    partNumber: z.string().max(100),
    partName: z.string().max(200).optional(),
    material: z.string().max(100),
    materialSpec: z.string().max(100).optional(),
    partType: z.string(),
  }).passthrough(),
  equipment: z.object({
    manufacturer: z.string().max(100).optional(),
    model: z.string().max(100).optional(),
    serialNumber: z.string().max(100).optional(),
    transducerType: z.string().max(100).optional(),
    frequency: z.string().max(50).optional(),
  }).passthrough(),
  calibration: z.object({
    standardType: z.string().max(200).optional(),
    referenceMaterial: z.string().max(100).optional(),
    blockSerialNumber: z.string().max(100).optional(),
  }).passthrough(),
  scanParameters: z.object({
    scanMethod: z.string().max(100).optional(),
    scanSpeed: z.union([z.number(), z.string().max(50)]).optional(),
    scanIndex: z.union([z.number(), z.string().max(50)]).optional(),
  }).passthrough(),
  acceptanceCriteria: z.object({
    acceptanceClass: z.string(),
    discontinuityType: z.string().max(200).optional(),
    maximumAllowableSize: z.string().max(100).optional(),
  }).passthrough(),
  documentation: z.object({
    inspectorName: z.string().max(100),
    certificationLevel: z.string().max(50).optional(),
    inspectionDate: z.string(),
  }).passthrough(),
}).passthrough();

// Validate technique sheet data
export function validateTechniqueSheetData(data: unknown): { valid: boolean; error?: string } {
  const result = techniqueSheetDataSchema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    return { 
      valid: false, 
      error: `${firstError.path.join('.')}: ${firstError.message}` 
    };
  }
  return { valid: true };
}
