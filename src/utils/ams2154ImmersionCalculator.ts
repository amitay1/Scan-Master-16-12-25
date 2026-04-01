/**
 * AMS-STD-2154E Figure 10 - cylindrical immersion offset method.
 *
 * Figure 10 defines:
 *   sin(phi) = (VLW / VSH) * sin(phiR)
 *   d = R * sin(phi)
 *
 * where:
 * - phi  = incident angle in water
 * - phiR = refracted shear-wave angle in the material
 * - VLW  = longitudinal velocity in water
 * - VSH  = shear-wave velocity in the material
 * - R    = cylinder outer radius
 * - d    = transducer centerline offset from the cylinder normal
 */

export const AMS_2154_DEFAULT_WATER_VELOCITY = 1480; // m/s

function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

export interface Ams2154CylindricalOffsetInput {
  outerRadius: number;
  refractedAngle: number;
  shearVelocity: number;
  waterVelocity?: number;
}

export interface Ams2154CylindricalOffsetResult {
  incidentAngle: number;
  offset: number;
  velocityRatio: number;
}

/**
 * Calculate the immersion incident angle in water for a desired refracted
 * shear-wave angle in the inspected part.
 */
export function calculateAms2154IncidentAngle(
  refractedAngle: number,
  shearVelocity: number,
  waterVelocity: number = AMS_2154_DEFAULT_WATER_VELOCITY
): number {
  const sinIncident =
    (waterVelocity / shearVelocity) * Math.sin(degToRad(refractedAngle));

  if (Math.abs(sinIncident) > 1) {
    throw new Error(
      `Cannot achieve ${refractedAngle}° refracted angle with water velocity ${waterVelocity} m/s and shear velocity ${shearVelocity} m/s`
    );
  }

  return radToDeg(Math.asin(sinIncident));
}

/**
 * Calculate the cylindrical beam offset directly from the incident angle:
 * d = R * sin(phi)
 */
export function calculateAms2154CylindricalOffsetFromIncidentAngle(
  outerRadius: number,
  incidentAngle: number
): number {
  return outerRadius * Math.sin(degToRad(incidentAngle));
}

/**
 * Calculate the full Figure 10 result from refracted angle and velocities.
 */
export function calculateAms2154CylindricalOffset(
  input: Ams2154CylindricalOffsetInput
): Ams2154CylindricalOffsetResult {
  const waterVelocity = input.waterVelocity ?? AMS_2154_DEFAULT_WATER_VELOCITY;
  const incidentAngle = calculateAms2154IncidentAngle(
    input.refractedAngle,
    input.shearVelocity,
    waterVelocity
  );

  return {
    incidentAngle,
    offset: calculateAms2154CylindricalOffsetFromIncidentAngle(
      input.outerRadius,
      incidentAngle
    ),
    velocityRatio: waterVelocity / input.shearVelocity,
  };
}
