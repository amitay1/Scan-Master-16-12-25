/**
 * Automatic Patch Generator
 *
 * Generates optimal scan patches for UT inspection based on:
 * - Part geometry and dimensions
 * - Coverage requirements (from OEM rules)
 * - Probe characteristics
 * - Exclusion zones
 *
 * Uses physics from coverageCalculator.ts for beam calculations.
 */

import type {
  PartGeometry,
  MaterialType,
  PatchGeneratorInput,
  PatchPlan,
  Patch,
  PatchGeometry,
  ExcludedZone,
  ScanStrategy,
  EdgeHandling,
  OEMRuleSet,
  ScannerKinematics,
  DwellTimeConstraints,
  IncidenceAngleConstraints,
  PatchValidationResult,
} from '@/types/techniqueSheet';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_PATCH_SIZE = 150; // mm
const DEFAULT_MAX_SCAN_SPEED = 100; // mm/s
const DEFAULT_COVERAGE_TARGET = 100; // %
const DEFAULT_OVERLAP = 15; // %
const EDGE_MARGIN = 3; // mm from edges

// ============================================================================
// Extended Input with Scanner Constraints
// ============================================================================

export interface ExtendedPatchGeneratorInput extends PatchGeneratorInput {
  // Scanner machine constraints
  scannerKinematics?: ScannerKinematics;

  // Dwell time constraints
  dwellTimeConstraints?: DwellTimeConstraints;

  // Incidence angle constraints
  incidenceAngleConstraints?: IncidenceAngleConstraints;

  // PRF (Pulse Repetition Frequency)
  prf?: number; // Hz
}

// ============================================================================
// Default Constraints (per typical industrial UT standards)
// ============================================================================

const DEFAULT_SCANNER_KINEMATICS: ScannerKinematics = {
  maxScanSpeed: 150,        // mm/s
  maxIndexSpeed: 100,       // mm/s
  maxAcceleration: 500,     // mm/s²
  maxDeceleration: 500,     // mm/s²
  maxTravel: { x: 1000, y: 500, z: 300 },
  minRadius: 10,            // mm
  maxIncidenceAngle: 15,    // degrees
};

const DEFAULT_DWELL_TIME: DwellTimeConstraints = {
  minDwellTime: 2,          // μs (minimum for proper signal acquisition)
  maxDwellTime: 100,        // μs
  prfLimit: 5000,           // Hz (typical limit)
};

const DEFAULT_INCIDENCE_CONSTRAINTS: IncidenceAngleConstraints = {
  maxIncidenceAngle: 15,    // degrees (for longitudinal waves)
  criticalAngleWarning: 10, // degrees (warn user)
  mode: 'longitudinal',
};

// ============================================================================
// Geometry Classification
// ============================================================================

type GeometryCategory = 'flat' | 'cylindrical' | 'tubular' | 'complex';

function classifyGeometry(partGeometry: PartGeometry): GeometryCategory {
  const flatTypes: PartGeometry[] = [
    'box', 'plate', 'sheet', 'slab', 'flat_bar', 'rectangular_bar',
    'square_bar', 'billet', 'block', 'l_profile', 't_profile', 'i_profile',
    'u_profile', 'z_profile',
  ];

  const cylindricalTypes: PartGeometry[] = [
    'cylinder', 'round_bar', 'shaft', 'disk', 'disk_forging', 'hub',
    'forging', 'round_forging_stock',
  ];

  const tubularTypes: PartGeometry[] = [
    'tube', 'pipe', 'ring', 'ring_forging', 'sleeve', 'bushing',
    'rectangular_tube', 'square_tube',
  ];

  if (flatTypes.includes(partGeometry)) return 'flat';
  if (cylindricalTypes.includes(partGeometry)) return 'cylindrical';
  if (tubularTypes.includes(partGeometry)) return 'tubular';
  return 'complex';
}

// ============================================================================
// Beam Physics Calculations
// (Simplified versions - full physics in coverageCalculator.ts)
// ============================================================================

/**
 * Calculate effective beam diameter at a given depth
 */
function calculateBeamDiameter(
  probeDiameter: number,
  frequency: number,
  depth: number,
  velocity: number = 5900 // Default steel velocity m/s
): number {
  // Near field distance: N = D²f / (4v)
  const N = (probeDiameter * probeDiameter * frequency) / (4 * velocity / 1000);

  // Wavelength
  const wavelength = velocity / (frequency * 1000); // mm

  // Beam divergence half-angle
  const sinTheta = 1.22 * wavelength / probeDiameter;
  const theta = Math.asin(Math.min(sinTheta, 1)) * (180 / Math.PI);

  if (depth <= N) {
    // In near field - beam is approximately probe diameter
    return probeDiameter * (0.9 + 0.1 * (depth / N));
  } else {
    // In far field - beam diverges
    const divergence = 2 * (depth - N) * Math.tan(theta * Math.PI / 180);
    return probeDiameter + divergence;
  }
}

/**
 * Calculate optimal scan index for target overlap
 */
function calculateScanIndex(
  beamDiameter: number,
  overlapPercent: number
): number {
  const overlapFraction = overlapPercent / 100;
  return beamDiameter * (1 - overlapFraction);
}

/**
 * Calculate number of passes needed
 */
function calculatePasses(
  dimension: number,
  scanIndex: number,
  edgeMargin: number = EDGE_MARGIN
): number {
  const effectiveDimension = dimension - 2 * edgeMargin;
  return Math.ceil(effectiveDimension / scanIndex) + 1;
}

// ============================================================================
// Patch Generation - Flat Parts
// ============================================================================

function generateFlatPatches(input: PatchGeneratorInput): Patch[] {
  const { dimensions, probeFootprint, coverageTarget, overlapRequired } = input;
  const maxPatchSize = input.maxPatchSize || DEFAULT_MAX_PATCH_SIZE;

  const length = dimensions.length;
  const width = dimensions.width;

  const patches: Patch[] = [];
  const scanIndex = calculateScanIndex(probeFootprint.width, overlapRequired);

  // Determine number of patches in each direction
  const patchesInX = Math.ceil(length / maxPatchSize);
  const patchesInY = Math.ceil(width / maxPatchSize);

  const patchWidth = length / patchesInX;
  const patchHeight = width / patchesInY;

  let sequence = 1;

  for (let i = 0; i < patchesInX; i++) {
    for (let j = 0; j < patchesInY; j++) {
      const x = i * patchWidth;
      const y = j * patchHeight;

      // Calculate actual dimensions with edge margins
      const actualWidth = Math.min(patchWidth, length - x);
      const actualHeight = Math.min(patchHeight, width - y);

      const passes = calculatePasses(actualHeight, scanIndex);
      const estimatedTime = (actualWidth * passes) / (input.maxScanSpeed || DEFAULT_MAX_SCAN_SPEED);

      const patch: Patch = {
        id: `P${sequence}`,
        name: `Patch ${sequence}`,
        geometry: {
          shape: 'rectangle',
          x,
          y,
          width: actualWidth,
          height: actualHeight,
        },
        scanStrategy: 'raster',
        direction: getDirectionForPatch(sequence, 'flat'),
        waveMode: 'longitudinal',
        scanSpeed: input.maxScanSpeed || DEFAULT_MAX_SCAN_SPEED,
        scanIndex,
        overlap: {
          previous: i > 0 || j > 0 ? overlapRequired : 0,
          next: i < patchesInX - 1 || j < patchesInY - 1 ? overlapRequired : 0,
        },
        edgeHandling: 'extend',
        coverage: coverageTarget,
        passes,
        estimatedTime,
        sequence,
        status: 'planned',
      };

      patches.push(patch);
      sequence++;
    }
  }

  return patches;
}

// ============================================================================
// Patch Generation - Cylindrical Parts
// ============================================================================

function generateCylindricalPatches(input: PatchGeneratorInput): Patch[] {
  const { dimensions, probeFootprint, overlapRequired } = input;
  const maxPatchSize = input.maxPatchSize || DEFAULT_MAX_PATCH_SIZE;

  const diameter = dimensions.outerDiameter || dimensions.width;
  const length = dimensions.length || dimensions.thickness;
  const radius = diameter / 2;
  const circumference = Math.PI * diameter;

  const patches: Patch[] = [];
  const scanIndex = calculateScanIndex(probeFootprint.width, overlapRequired);

  // Calculate angular patch size
  const angularPatchSize = (maxPatchSize / circumference) * 360;
  const patchesAngular = Math.ceil(360 / angularPatchSize);
  const actualAngularSize = 360 / patchesAngular;

  // Calculate axial patch count
  const patchesAxial = Math.ceil(length / maxPatchSize);
  const axialPatchSize = length / patchesAxial;

  let sequence = 1;

  for (let i = 0; i < patchesAxial; i++) {
    for (let j = 0; j < patchesAngular; j++) {
      const startAngle = j * actualAngularSize;
      const endAngle = startAngle + actualAngularSize;
      const axialStart = i * axialPatchSize;

      // Arc length for time calculation
      const arcLength = (actualAngularSize / 360) * circumference;
      const passes = calculatePasses(axialPatchSize, scanIndex);
      const estimatedTime = (arcLength * passes) / (input.maxScanSpeed || DEFAULT_MAX_SCAN_SPEED);

      const patch: Patch = {
        id: `C${sequence}`,
        name: `Circumferential ${sequence}`,
        geometry: {
          shape: 'arc',
          startAngle,
          endAngle,
          outerRadius: radius,
          innerRadius: 0,
          y: axialStart, // Using y for axial position
          height: axialPatchSize, // Axial extent
        },
        scanStrategy: 'circumferential',
        direction: getDirectionForPatch(sequence, 'cylindrical'),
        waveMode: 'longitudinal',
        scanSpeed: input.maxScanSpeed || DEFAULT_MAX_SCAN_SPEED,
        scanIndex,
        overlap: {
          previous: sequence > 1 ? overlapRequired : 0,
          next: sequence < patchesAxial * patchesAngular ? overlapRequired : 0,
        },
        edgeHandling: 'overlap',
        coverage: input.coverageTarget,
        passes,
        estimatedTime,
        sequence,
        status: 'planned',
      };

      patches.push(patch);
      sequence++;
    }
  }

  return patches;
}

// ============================================================================
// Patch Generation - Tubular Parts (Ring/Tube)
// ============================================================================

function generateTubularPatches(input: PatchGeneratorInput): Patch[] {
  const { dimensions, probeFootprint, overlapRequired } = input;

  const od = dimensions.outerDiameter || dimensions.width;
  const id = dimensions.innerDiameter || 0;
  const wallThickness = (od - id) / 2;
  const length = dimensions.length || dimensions.thickness;

  const patches: Patch[] = [];
  const scanIndex = calculateScanIndex(probeFootprint.width, overlapRequired);

  // OD scan patches
  const odPatches = generateCylindricalPatches({
    ...input,
    dimensions: {
      ...dimensions,
      outerDiameter: od,
    },
  });

  // Renumber and label as OD
  odPatches.forEach((p, i) => {
    p.id = `OD${i + 1}`;
    p.name = `OD Scan ${i + 1}`;
  });

  patches.push(...odPatches);

  // ID scan patches (if hollow and accessible)
  if (id > 0 && id > 20) { // Minimum 20mm ID for accessibility
    const idPatches = generateCylindricalPatches({
      ...input,
      dimensions: {
        ...dimensions,
        outerDiameter: id,
      },
    });

    // Renumber and label as ID
    idPatches.forEach((p, i) => {
      p.id = `ID${i + 1}`;
      p.name = `ID Scan ${i + 1}`;
      p.sequence = odPatches.length + i + 1;
    });

    patches.push(...idPatches);
  }

  // End face patches (if applicable)
  if (wallThickness > 5) { // Only if wall is thick enough
    const endFacePatches = generateAnnularPatches(input, od / 2, id / 2);

    let seq = patches.length + 1;
    endFacePatches.forEach((p, i) => {
      p.id = `EF${i + 1}`;
      p.name = `End Face ${i + 1}`;
      p.sequence = seq++;
    });

    patches.push(...endFacePatches);
  }

  return patches;
}

// ============================================================================
// Patch Generation - Annular (End Faces of Rings/Tubes)
// ============================================================================

function generateAnnularPatches(
  input: PatchGeneratorInput,
  outerRadius: number,
  innerRadius: number
): Patch[] {
  const { probeFootprint, overlapRequired, coverageTarget } = input;

  const patches: Patch[] = [];
  const scanIndex = calculateScanIndex(probeFootprint.width, overlapRequired);

  // Divide into radial zones
  const radialExtent = outerRadius - innerRadius;
  const zonesRadial = Math.ceil(radialExtent / 50); // 50mm radial zones
  const radialZoneSize = radialExtent / zonesRadial;

  let sequence = 1;

  for (let i = 0; i < zonesRadial; i++) {
    const zoneInnerRadius = innerRadius + i * radialZoneSize;
    const zoneOuterRadius = zoneInnerRadius + radialZoneSize;

    // Full 360° annular patch
    const circumference = Math.PI * (zoneInnerRadius + zoneOuterRadius);
    const passes = calculatePasses(radialZoneSize, scanIndex);
    const estimatedTime = circumference / (input.maxScanSpeed || DEFAULT_MAX_SCAN_SPEED) * passes;

    const patch: Patch = {
      id: `A${sequence}`,
      name: `Annular Zone ${sequence}`,
      geometry: {
        shape: 'annular',
        startAngle: 0,
        endAngle: 360,
        innerRadius: zoneInnerRadius,
        outerRadius: zoneOuterRadius,
      },
      scanStrategy: 'spiral',
      direction: 'A', // End face is typically direction A
      waveMode: 'longitudinal',
      scanSpeed: input.maxScanSpeed || DEFAULT_MAX_SCAN_SPEED,
      scanIndex,
      overlap: {
        previous: i > 0 ? overlapRequired : 0,
        next: i < zonesRadial - 1 ? overlapRequired : 0,
      },
      edgeHandling: 'overlap',
      coverage: coverageTarget,
      passes,
      estimatedTime,
      sequence,
      status: 'planned',
    };

    patches.push(patch);
    sequence++;
  }

  return patches;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get scan direction label based on patch sequence and geometry type
 */
function getDirectionForPatch(sequence: number, geometryType: string): string {
  const directions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  if (geometryType === 'flat') {
    // Alternate between A/B for flat parts (axial directions)
    return sequence % 2 === 1 ? 'A' : 'B';
  } else if (geometryType === 'cylindrical') {
    // C for circumferential, D for axial on cylinders
    return sequence % 2 === 1 ? 'C' : 'D';
  }

  return directions[(sequence - 1) % directions.length];
}

/**
 * Apply exclusion zones to patches
 */
function applyExclusionZones(
  patches: Patch[],
  excludedZones: ExcludedZone[]
): Patch[] {
  if (!excludedZones || excludedZones.length === 0) {
    return patches;
  }

  return patches.map((patch) => {
    // Check for overlap with excluded zones
    const overlappingZones = excludedZones.filter((zone) =>
      checkGeometryOverlap(patch.geometry, zone.geometry)
    );

    if (overlappingZones.length > 0) {
      return {
        ...patch,
        status: 'warning' as const,
        warnings: [
          ...(patch.warnings || []),
          `Overlaps with excluded zone: ${overlappingZones.map((z) => z.reason).join(', ')}`,
        ],
      };
    }

    return patch;
  });
}

/**
 * Simple geometry overlap check
 */
function checkGeometryOverlap(geom1: PatchGeometry, geom2: PatchGeometry): boolean {
  if (geom1.shape === 'rectangle' && geom2.shape === 'rectangle') {
    // Rectangle-rectangle intersection
    const x1 = geom1.x || 0;
    const y1 = geom1.y || 0;
    const w1 = geom1.width || 0;
    const h1 = geom1.height || 0;

    const x2 = geom2.x || 0;
    const y2 = geom2.y || 0;
    const w2 = geom2.width || 0;
    const h2 = geom2.height || 0;

    return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
  }

  // For arc/annular, simplified check
  // In production, would need proper arc intersection math
  return false;
}

/**
 * Calculate total coverage from patches
 */
function calculateTotalCoverage(
  patches: Patch[],
  totalArea: number
): number {
  if (totalArea === 0) return 0;

  let coveredArea = 0;

  for (const patch of patches) {
    if (patch.geometry.shape === 'rectangle') {
      coveredArea += (patch.geometry.width || 0) * (patch.geometry.height || 0);
    } else if (patch.geometry.shape === 'arc' || patch.geometry.shape === 'annular') {
      const outerR = patch.geometry.outerRadius || 0;
      const innerR = patch.geometry.innerRadius || 0;
      const angleSpan = ((patch.geometry.endAngle || 360) - (patch.geometry.startAngle || 0)) / 360;
      coveredArea += Math.PI * (outerR * outerR - innerR * innerR) * angleSpan;
    }
  }

  return Math.min(100, (coveredArea / totalArea) * 100);
}

/**
 * Calculate total inspection area for a part
 */
function calculateTotalArea(input: PatchGeneratorInput): number {
  const { partGeometry, dimensions } = input;
  const category = classifyGeometry(partGeometry);

  switch (category) {
    case 'flat':
      return dimensions.length * dimensions.width;

    case 'cylindrical': {
      const diameter = dimensions.outerDiameter || dimensions.width;
      const length = dimensions.length || dimensions.thickness;
      return Math.PI * diameter * length; // Cylindrical surface
    }

    case 'tubular': {
      const od = dimensions.outerDiameter || dimensions.width;
      const id = dimensions.innerDiameter || 0;
      const length = dimensions.length || dimensions.thickness;
      // OD + ID surfaces + 2 end faces
      const odSurface = Math.PI * od * length;
      const idSurface = id > 0 ? Math.PI * id * length : 0;
      const endFaces = 2 * Math.PI * ((od / 2) ** 2 - (id / 2) ** 2);
      return odSurface + idSurface + endFaces;
    }

    default:
      // For complex shapes, estimate based on bounding box
      return dimensions.length * dimensions.width * 1.5;
  }
}

// ============================================================================
// Main Generator Function
// ============================================================================

/**
 * Generate a complete patch plan for a part
 */
export function generatePatchPlan(input: PatchGeneratorInput): PatchPlan {
  const {
    partGeometry,
    coverageTarget = DEFAULT_COVERAGE_TARGET,
    overlapRequired = DEFAULT_OVERLAP,
    excludedZones = [],
    oemRules,
  } = input;

  // Apply OEM rules if provided
  const effectiveCoverage = oemRules?.coverageRequirements.minCoverage
    ? Math.max(coverageTarget, oemRules.coverageRequirements.minCoverage)
    : coverageTarget;

  const effectiveOverlap = oemRules?.coverageRequirements.overlapRequirement
    ? Math.max(overlapRequired, oemRules.coverageRequirements.overlapRequirement)
    : overlapRequired;

  const adjustedInput: PatchGeneratorInput = {
    ...input,
    coverageTarget: effectiveCoverage,
    overlapRequired: effectiveOverlap,
  };

  // Generate patches based on geometry type
  const category = classifyGeometry(partGeometry);
  let patches: Patch[];

  switch (category) {
    case 'flat':
      patches = generateFlatPatches(adjustedInput);
      break;
    case 'cylindrical':
      patches = generateCylindricalPatches(adjustedInput);
      break;
    case 'tubular':
      patches = generateTubularPatches(adjustedInput);
      break;
    default:
      // For complex geometries, fall back to flat patching
      patches = generateFlatPatches(adjustedInput);
      patches.forEach((p) => {
        p.warnings = [...(p.warnings || []), 'Complex geometry - manual verification required'];
        p.status = 'warning';
      });
  }

  // Apply exclusion zones
  patches = applyExclusionZones(patches, excludedZones);

  // Calculate summary metrics
  const totalArea = calculateTotalArea(adjustedInput);
  const totalCoverage = calculateTotalCoverage(patches, totalArea);
  const totalPasses = patches.reduce((sum, p) => sum + p.passes, 0);
  const estimatedTotalTime = patches.reduce((sum, p) => sum + p.estimatedTime, 0);

  // Validate against requirements
  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];

  if (totalCoverage < effectiveCoverage) {
    validationErrors.push(
      `Coverage ${totalCoverage.toFixed(1)}% is below target ${effectiveCoverage}%`
    );
  }

  const warningPatches = patches.filter((p) => p.status === 'warning');
  if (warningPatches.length > 0) {
    validationWarnings.push(
      `${warningPatches.length} patch(es) have warnings - review required`
    );
  }

  if (excludedZones.length > 0) {
    validationWarnings.push(
      `${excludedZones.length} exclusion zone(s) defined - verify coverage`
    );
  }

  // Build result
  const plan: PatchPlan = {
    id: `PP-${Date.now()}`,
    version: '1.0',
    createdDate: new Date().toISOString(),

    partGeometry,
    coverageTarget: effectiveCoverage,
    overlapRequired: effectiveOverlap,
    oemVendor: oemRules?.vendorId,

    patches,
    excludedZones,

    totalCoverage,
    totalPatches: patches.length,
    totalPasses,
    estimatedTotalTime,

    meetsRequirements: validationErrors.length === 0,
    validationErrors,
    validationWarnings,

    optimizationStrategy: 'coverage_first',
    optimizationScore: calculateOptimizationScore(patches, effectiveCoverage, estimatedTotalTime),
  };

  return plan;
}

// ============================================================================
// Dwell Time & Incidence Angle Validation
// ============================================================================

/**
 * Calculate dwell time based on scan speed and index
 * Dwell time = time the probe spends at each inspection point
 */
function calculateDwellTime(
  scanSpeed: number,      // mm/s
  scanIndex: number,      // mm
  prf: number            // Hz (pulses per second)
): { dwellTimeUs: number; pulsesPerPoint: number; isValid: boolean; warning?: string } {
  // Time to move one index step
  const timePerStep = scanIndex / scanSpeed; // seconds

  // Number of pulses during that time
  const pulsesPerPoint = prf * timePerStep;

  // Effective dwell time in microseconds
  const dwellTimeUs = (1 / prf) * 1e6; // Time between pulses

  const isValid = pulsesPerPoint >= 1; // At least 1 pulse per point
  let warning: string | undefined;

  if (pulsesPerPoint < 1) {
    warning = `Scan speed too fast: only ${pulsesPerPoint.toFixed(2)} pulses per point. Reduce speed or increase PRF.`;
  } else if (pulsesPerPoint < 3) {
    warning = `Low pulse density: ${pulsesPerPoint.toFixed(1)} pulses per point. Consider reducing speed for better reliability.`;
  }

  return { dwellTimeUs, pulsesPerPoint, isValid, warning };
}

/**
 * Calculate incidence angle for curved surfaces
 * Critical for maintaining proper beam coupling
 */
function calculateIncidenceAngle(
  surfaceRadius: number,  // mm (infinite for flat)
  probePosition: number,  // mm from center (for circular parts)
  probeWidth: number      // mm
): { maxAngle: number; isValid: boolean; warning?: string } {
  if (surfaceRadius === Infinity || surfaceRadius === 0) {
    // Flat surface - no incidence angle issue
    return { maxAngle: 0, isValid: true };
  }

  // For curved surfaces, the incidence angle varies across the probe footprint
  // Maximum angle occurs at the edges of the probe
  const halfWidth = probeWidth / 2;
  const maxAngle = Math.asin(halfWidth / surfaceRadius) * (180 / Math.PI);

  const isValid = maxAngle <= DEFAULT_INCIDENCE_CONSTRAINTS.maxIncidenceAngle;
  let warning: string | undefined;

  if (maxAngle > DEFAULT_INCIDENCE_CONSTRAINTS.criticalAngleWarning) {
    warning = `Incidence angle ${maxAngle.toFixed(1)}° approaches critical angle. Consider smaller probe or slower speed.`;
  }

  if (!isValid) {
    warning = `Incidence angle ${maxAngle.toFixed(1)}° exceeds limit of ${DEFAULT_INCIDENCE_CONSTRAINTS.maxIncidenceAngle}°. Use smaller probe or curved contact shoe.`;
  }

  return { maxAngle, isValid, warning };
}

/**
 * Validate a single patch against all constraints
 */
export function validatePatch(
  patch: Patch,
  input: ExtendedPatchGeneratorInput
): PatchValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const kinematics = input.scannerKinematics || DEFAULT_SCANNER_KINEMATICS;
  const dwellConstraints = input.dwellTimeConstraints || DEFAULT_DWELL_TIME;
  const incidenceConstraints = input.incidenceAngleConstraints || DEFAULT_INCIDENCE_CONSTRAINTS;
  const prf = input.prf || dwellConstraints.prfLimit;

  // 1. Speed validation
  const speedOk = patch.scanSpeed <= kinematics.maxScanSpeed;
  if (!speedOk) {
    errors.push(`Scan speed ${patch.scanSpeed} mm/s exceeds machine limit of ${kinematics.maxScanSpeed} mm/s`);
  }

  // 2. Dwell time validation
  const dwellResult = calculateDwellTime(patch.scanSpeed, patch.scanIndex, prf);
  const dwellTimeOk = dwellResult.isValid;
  if (!dwellTimeOk) {
    errors.push(dwellResult.warning || 'Insufficient dwell time');
  } else if (dwellResult.warning) {
    warnings.push(dwellResult.warning);
  }

  // 3. Incidence angle validation (for curved surfaces)
  let incidenceAngleOk = true;
  if (patch.geometry.shape === 'arc' || patch.geometry.shape === 'annular') {
    const radius = patch.geometry.outerRadius || input.dimensions.outerDiameter! / 2;
    const probeWidth = input.probeFootprint.width;
    const incidenceResult = calculateIncidenceAngle(radius, 0, probeWidth);
    incidenceAngleOk = incidenceResult.isValid;

    if (!incidenceAngleOk) {
      errors.push(incidenceResult.warning || 'Incidence angle too high');
    } else if (incidenceResult.warning) {
      warnings.push(incidenceResult.warning);
    }
  }

  // 4. Coverage validation
  const coverageOk = patch.coverage >= (input.coverageTarget * 0.95); // 95% of target
  if (!coverageOk) {
    warnings.push(`Patch coverage ${patch.coverage.toFixed(1)}% below target ${input.coverageTarget}%`);
  }

  // 5. Travel limit validation
  if (patch.geometry.shape === 'rectangle') {
    const x = (patch.geometry.x || 0) + (patch.geometry.width || 0);
    const y = (patch.geometry.y || 0) + (patch.geometry.height || 0);

    if (x > kinematics.maxTravel.x) {
      errors.push(`Patch extends beyond X travel limit: ${x}mm > ${kinematics.maxTravel.x}mm`);
    }
    if (y > kinematics.maxTravel.y) {
      errors.push(`Patch extends beyond Y travel limit: ${y}mm > ${kinematics.maxTravel.y}mm`);
    }
  }

  // 6. Minimum radius check (for curved paths)
  if (kinematics.minRadius && patch.geometry.shape === 'arc') {
    const innerRadius = patch.geometry.innerRadius || 0;
    if (innerRadius > 0 && innerRadius < kinematics.minRadius) {
      warnings.push(`Inner radius ${innerRadius}mm below machine minimum ${kinematics.minRadius}mm - verify motion capability`);
    }
  }

  return {
    patchId: patch.id,
    isValid: errors.length === 0,
    errors,
    warnings,
    dwellTimeOk,
    incidenceAngleOk,
    coverageOk,
    speedOk,
  };
}

/**
 * Validate all patches in a plan
 */
export function validatePatchPlan(
  patches: Patch[],
  input: ExtendedPatchGeneratorInput
): { validationResults: PatchValidationResult[]; allValid: boolean; summary: string } {
  const results = patches.map(p => validatePatch(p, input));
  const allValid = results.every(r => r.isValid);

  const errorCount = results.filter(r => !r.isValid).length;
  const warningCount = results.filter(r => r.warnings.length > 0).length;

  let summary = '';
  if (allValid && warningCount === 0) {
    summary = `✅ All ${patches.length} patches validated successfully`;
  } else if (allValid) {
    summary = `⚠️ ${patches.length} patches valid, but ${warningCount} have warnings`;
  } else {
    summary = `❌ ${errorCount} of ${patches.length} patches have validation errors`;
  }

  return { validationResults: results, allValid, summary };
}

/**
 * Calculate optimization score (0-100)
 */
function calculateOptimizationScore(
  patches: Patch[],
  targetCoverage: number,
  totalTime: number
): number {
  let score = 100;

  // Penalize for warnings
  const warnings = patches.filter((p) => p.status === 'warning').length;
  score -= warnings * 5;

  // Penalize for many patches (complexity)
  if (patches.length > 20) {
    score -= (patches.length - 20) * 2;
  }

  // Penalize for long scan time (> 2 hours)
  if (totalTime > 7200) {
    score -= Math.min(20, (totalTime - 7200) / 360);
  }

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// Utility Exports
// ============================================================================

export {
  classifyGeometry,
  calculateBeamDiameter,
  calculateScanIndex,
  calculatePasses,
  calculateDwellTime,
  calculateIncidenceAngle,
  validatePatch,
  validatePatchPlan,
  DEFAULT_SCANNER_KINEMATICS,
  DEFAULT_DWELL_TIME,
  DEFAULT_INCIDENCE_CONSTRAINTS,
};

export type { ExtendedPatchGeneratorInput };
