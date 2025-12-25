/**
 * Inspector Profile Types
 * Defines the structure for inspector profiles used throughout the application.
 * Profiles store inspector credentials and certification information.
 */

export type CertificationLevel = 'Level I' | 'Level II' | 'Level III';

export interface InspectorProfile {
  id: string;
  name: string;
  initials: string;
  certificationLevel: CertificationLevel;
  certificationNumber: string;
  certifyingOrganization: string;
  employeeId?: string;
  department?: string;
  email?: string;
  phone?: string;
  signature?: string; // Base64 encoded signature image
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
}

export interface InspectorProfileFormData {
  name: string;
  certificationLevel: CertificationLevel;
  certificationNumber: string;
  certifyingOrganization: string;
  employeeId?: string;
  department?: string;
  email?: string;
  phone?: string;
}

export interface InspectorProfileStorage {
  profiles: InspectorProfile[];
  currentProfileId: string | null;
  rememberSelection: boolean;
}

export const CERTIFICATION_LEVELS: CertificationLevel[] = ['Level I', 'Level II', 'Level III'];

export const CERTIFYING_ORGANIZATIONS = [
  'ASNT',
  'ACCP',
  'PCN',
  'CSWIP',
  'ISO 9712',
  'EN 4179',
  'NAS 410',
  'Other',
] as const;

/**
 * Generate initials from a full name
 * @example "John Smith" -> "JS"
 * @example "John Michael Smith" -> "JS"
 */
export function generateInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Create a new profile with default values
 */
export function createEmptyProfile(): InspectorProfileFormData {
  return {
    name: '',
    certificationLevel: 'Level II',
    certificationNumber: '',
    certifyingOrganization: 'ASNT',
    employeeId: '',
    department: '',
    email: '',
    phone: '',
  };
}

/**
 * Validate profile form data
 */
export function validateProfileForm(data: InspectorProfileFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!data.certificationNumber.trim()) {
    errors.certificationNumber = 'Certification number is required';
  }

  if (!data.certifyingOrganization.trim()) {
    errors.certifyingOrganization = 'Certifying organization is required';
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format';
  }

  return errors;
}
