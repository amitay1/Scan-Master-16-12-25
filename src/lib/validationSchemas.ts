import { z } from 'zod';

// Auth validation schemas
export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'Please enter a valid email address' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(100, { message: 'Password must be less than 100 characters' }),
  fullName: z
    .string()
    .trim()
    .min(1, { message: 'Full name is required' })
    .max(100, { message: 'Full name must be less than 100 characters' }),
});

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .max(255, { message: 'Email must be less than 255 characters' })
    .refine(
      (val) => val === '0' || z.string().email().safeParse(val).success,
      { message: 'Please enter a valid email address' }
    ),
  password: z
    .string()
    .min(1, { message: 'Password is required' }),
});

// Inspection Setup validation
export const inspectionSetupSchema = z.object({
  partNumber: z
    .string()
    .trim()
    .min(1, { message: 'Part number is required' })
    .max(100, { message: 'Part number must be less than 100 characters' })
    .regex(/^[A-Za-z0-9\-_/\s]+$/, { message: 'Part number contains invalid characters' }),
  partName: z
    .string()
    .trim()
    .max(200, { message: 'Part name must be less than 200 characters' })
    .optional(),
  material: z
    .string()
    .trim()
    .min(1, { message: 'Material is required' })
    .max(100, { message: 'Material must be less than 100 characters' }),
  materialSpec: z
    .string()
    .trim()
    .max(100, { message: 'Material spec must be less than 100 characters' })
    .optional(),
  partType: z
    .string()
    .min(1, { message: 'Part type is required' }),
  thickness: z
    .string()
    .trim()
    .max(50, { message: 'Thickness must be less than 50 characters' })
    .optional(),
  diameter: z
    .string()
    .trim()
    .max(50, { message: 'Diameter must be less than 50 characters' })
    .optional(),
  length: z
    .string()
    .trim()
    .max(50, { message: 'Length must be less than 50 characters' })
    .optional(),
  width: z
    .string()
    .trim()
    .max(50, { message: 'Width must be less than 50 characters' })
    .optional(),
});

// Equipment validation
export const equipmentSchema = z.object({
  manufacturer: z
    .string()
    .trim()
    .max(100, { message: 'Manufacturer name must be less than 100 characters' })
    .optional(),
  model: z
    .string()
    .trim()
    .max(100, { message: 'Model must be less than 100 characters' })
    .optional(),
  serialNumber: z
    .string()
    .trim()
    .max(100, { message: 'Serial number must be less than 100 characters' })
    .regex(/^[A-Za-z0-9\-_/\s]*$/, { message: 'Serial number contains invalid characters' })
    .optional(),
  transducerType: z
    .string()
    .trim()
    .max(100, { message: 'Transducer type must be less than 100 characters' })
    .optional(),
  frequency: z
    .string()
    .trim()
    .max(50, { message: 'Frequency must be less than 50 characters' })
    .regex(/^[0-9.\s]*[A-Za-z]*$/, { message: 'Invalid frequency format' })
    .optional(),
  crystalDiameter: z
    .string()
    .trim()
    .max(50, { message: 'Crystal diameter must be less than 50 characters' })
    .regex(/^[0-9.\s]*[A-Za-z]*$/, { message: 'Invalid diameter format' })
    .optional(),
});

// Calibration validation
export const calibrationSchema = z.object({
  blockType: z
    .string()
    .trim()
    .max(200, { message: 'Block type must be less than 200 characters' })
    .optional(),
  referenceMaterial: z
    .string()
    .trim()
    .max(100, { message: 'Reference material must be less than 100 characters' })
    .optional(),
  calibrationDate: z
    .string()
    .trim()
    .optional(),
  blockSerialNumber: z
    .string()
    .trim()
    .max(100, { message: 'Block serial number must be less than 100 characters' })
    .regex(/^[A-Za-z0-9\-_/\s]*$/, { message: 'Block serial number contains invalid characters' })
    .optional(),
});

// Scan parameters validation
export const scanParametersSchema = z.object({
  scanMethod: z
    .string()
    .trim()
    .max(100, { message: 'Scan method must be less than 100 characters' })
    .optional(),
  scanSpeed: z
    .union([z.number(), z.string().transform((val) => parseFloat(val) || 0)])
    .optional(),
  indexResolution: z
    .string()
    .trim()
    .max(50, { message: 'Index resolution must be less than 50 characters' })
    .optional(),
  gainSetting: z
    .string()
    .trim()
    .max(50, { message: 'Gain setting must be less than 50 characters' })
    .regex(/^[0-9.\s-]*[A-Za-z]*$/, { message: 'Invalid gain format' })
    .optional(),
});

// Acceptance criteria validation
export const acceptanceCriteriaSchema = z.object({
  acceptanceClass: z
    .string()
    .min(1, { message: 'Acceptance class is required' }),
  discontinuityType: z
    .string()
    .trim()
    .max(200, { message: 'Discontinuity type must be less than 200 characters' })
    .optional(),
  maximumAllowableSize: z
    .string()
    .trim()
    .max(100, { message: 'Maximum allowable size must be less than 100 characters' })
    .optional(),
});

// Documentation validation
export const documentationSchema = z.object({
  inspectorName: z
    .string()
    .trim()
    .min(1, { message: 'Inspector name is required' })
    .max(100, { message: 'Inspector name must be less than 100 characters' })
    .regex(/^[A-Za-z\s\-'.]+$/, { message: 'Inspector name contains invalid characters' }),
  certificationLevel: z
    .string()
    .trim()
    .max(50, { message: 'Certification level must be less than 50 characters' })
    .optional(),
  inspectionDate: z
    .string()
    .trim()
    .min(1, { message: 'Inspection date is required' }),
});

// Helper function to validate field
export function validateField<T>(
  schema: z.ZodSchema<T>,
  data: T
): { success: boolean; errors: Record<string, string> } {
  try {
    schema.parse(data);
    return { success: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path) {
          errors[err.path.join('.')] = err.message;
        }
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
}
