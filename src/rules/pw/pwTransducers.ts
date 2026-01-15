/**
 * Pratt & Whitney Approved Transducers
 *
 * Source: NDIP-1226 Section 2.4, 2.5
 * Source: NDIP-1227 Section 2.4, 2.5
 */

export interface PWTransducer {
  partNumber: string;
  frequency: number; // MHz
  focalLength: number; // inches
  bandwidth: 'narrow' | 'medium' | 'wide';
  type: 'immersion' | 'contact';
  elementDiameter?: number; // inches
  description: string;
  source: string;
  mirrorPartNumber?: string;
}

export interface PWTransducerMirror {
  partNumber: string;
  angle: number; // degrees
  length: number; // inches
  compatibleTransducers: string[]; // transducer part numbers
  description: string;
}

/**
 * IAE2P16679 - Primary Transducer for V2500 HPT Inspection
 *
 * 5 MHz, 8" Focus, medium bandwidth
 * Must be sourced through PW NDE
 */
export const PW_PRIMARY_TRANSDUCER: PWTransducer = {
  partNumber: 'IAE2P16679',
  frequency: 5, // MHz
  focalLength: 8, // inches
  bandwidth: 'medium',
  type: 'immersion',
  description: '5 MHz, 8" Focus, medium bandwidth immersion transducer',
  source: 'Pratt & Whitney NDE (gppwmpendetoolsup@prattwhitney.com)',
  mirrorPartNumber: 'IAE2P16678',
};

/**
 * IAE2P16678 - 45° Mirror for angle beam inspection
 */
export const PW_45_DEGREE_MIRROR: PWTransducerMirror = {
  partNumber: 'IAE2P16678',
  angle: 45, // degrees
  length: 5, // inches
  compatibleTransducers: ['IAE2P16679'], // 5MHz 8" focus
  description: '45-degree mirror, 5" length, for 5MHz 8" focus transducer',
};

/**
 * All approved PW transducers
 */
export const PW_APPROVED_TRANSDUCERS: PWTransducer[] = [PW_PRIMARY_TRANSDUCER];

/**
 * All approved PW mirrors
 */
export const PW_APPROVED_MIRRORS: PWTransducerMirror[] = [PW_45_DEGREE_MIRROR];

/**
 * Get transducer by part number
 */
export function getTransducerByPN(
  partNumber: string
): PWTransducer | undefined {
  return PW_APPROVED_TRANSDUCERS.find((t) => t.partNumber === partNumber);
}

/**
 * Get compatible mirror for a transducer
 */
export function getCompatibleMirror(
  transducerPN: string
): PWTransducerMirror | undefined {
  return PW_APPROVED_MIRRORS.find((m) =>
    m.compatibleTransducers.includes(transducerPN)
  );
}

/**
 * Transducer setup parameters
 * Based on NDIP Section 5.1.1
 */
export interface TransducerSetup {
  waterPath: number; // inches
  incidentAngle: number; // degrees
  refractedAngle: number; // degrees
  waveType: 'longitudinal' | 'shear';
  mirrorRequired: boolean;
  normalizationRequired: boolean;
}

export const PW_HPT_TRANSDUCER_SETUP: TransducerSetup = {
  waterPath: 8.0, // inches (Section 5.1.1.2)
  incidentAngle: 18.6, // degrees - approximate (Section 5.1.1.3)
  refractedAngle: 45, // degrees - shear wave in part
  waveType: 'shear',
  mirrorRequired: true, // Per Section 7.6
  normalizationRequired: true, // Per Section 5.1.1.1, 7.7
};

/**
 * Calculate incident angle for desired refracted angle
 * Using Snell's Law: sin(θi)/sin(θr) = V1/V2
 *
 * For water to Nickel alloy:
 * - Water velocity: ~1480 m/s
 * - Nickel shear velocity: ~3000 m/s (approximate for PM nickel)
 *
 * @param refractedAngle Target angle in material (degrees)
 * @param waterVelocity Sound velocity in water (m/s)
 * @param materialShearVelocity Shear wave velocity in material (m/s)
 */
export function calculateIncidentAngle(
  refractedAngle: number,
  waterVelocity: number = 1480,
  materialShearVelocity: number = 3000
): number {
  const refractedRad = (refractedAngle * Math.PI) / 180;
  const sinIncident =
    (Math.sin(refractedRad) * waterVelocity) / materialShearVelocity;

  // Check if angle is achievable (critical angle)
  if (sinIncident > 1) {
    throw new Error(
      `Cannot achieve ${refractedAngle}° refracted angle - exceeds critical angle`
    );
  }

  const incidentRad = Math.asin(sinIncident);
  return (incidentRad * 180) / Math.PI;
}

/**
 * Transducer source contact information
 */
export const PW_TRANSDUCER_SOURCE = {
  department: 'Pratt & Whitney NDE',
  email: 'gppwmpendetoolsup@prattwhitney.com',
  note: 'Transducers must be sourced through PW NDE',
};
