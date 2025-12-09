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

// Technique sheet data validation - flexible for saving drafts
export const techniqueSheetDataSchema = z.object({
  standardName: z.string().optional(),
  inspectionSetup: z.object({
    partNumber: z.string().max(100).optional().default(''),
    partName: z.string().max(200).optional().default(''),
    material: z.string().max(100).optional().default(''),
    materialSpec: z.string().max(100).optional().default(''),
    partType: z.string().optional().default(''),
  }).passthrough(),
  equipment: z.object({
    manufacturer: z.string().max(100).optional().default(''),
    model: z.string().max(100).optional().default(''),
    serialNumber: z.string().max(100).optional().default(''),
    transducerType: z.string().max(100).optional().default(''),
    frequency: z.string().max(50).optional().default(''),
  }).passthrough(),
  calibration: z.object({
    standardType: z.string().max(200).optional().default(''),
    referenceMaterial: z.string().max(100).optional().default(''),
    blockSerialNumber: z.string().max(100).optional().default(''),
  }).passthrough(),
  scanParameters: z.object({
    scanMethod: z.string().max(100).optional().default(''),
    scanSpeed: z.union([z.number(), z.string().max(50)]).optional(),
    scanIndex: z.union([z.number(), z.string().max(50)]).optional(),
  }).passthrough(),
  acceptanceCriteria: z.object({
    acceptanceClass: z.string().optional().default(''),
    discontinuityType: z.string().max(200).optional().default(''),
    maximumAllowableSize: z.string().max(100).optional().default(''),
  }).passthrough(),
  documentation: z.object({
    inspectorName: z.string().max(100).optional().default(''),
    certificationLevel: z.string().max(50).optional().default(''),
    inspectionDate: z.string().optional().default(''),
  }).passthrough(),
  scanDetails: z.any().optional(),
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
