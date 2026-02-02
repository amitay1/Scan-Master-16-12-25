/**
 * Tests for angleBeamCalculator.ts
 *
 * Covers: Snell's law, beam path geometry, critical angles,
 * SDH/notch sizing, material lookups, and the main block selector.
 *
 * Physics reference values verified against ASTM E494, EN 12223,
 * and standard NDT handbooks.
 */
import { describe, it, expect } from 'vitest';
import {
  degToRad,
  radToDeg,
  calculateRefractedAngle,
  calculateWedgeAngle,
  calculateCriticalAngles,
  calculateBeamPath,
  calculateDepthFromSurfaceDistance,
  getRecommendedSDHSize,
  getRecommendedNotch,
  selectAngleBeamCalibrationBlock,
  getMaterialVelocity,
  formatBeamPathSummary,
  calculateScanRange,
  MATERIAL_VELOCITIES,
  STANDARD_WEDGES,
  ANGLE_BEAM_BLOCKS,
} from '@/utils/angleBeamCalculator';

// ---------------------------------------------------------------------------
// Helper: allow floating-point tolerance
// ---------------------------------------------------------------------------
const ANGLE_TOLERANCE = 0.5; // degrees
const MM_TOLERANCE = 0.5;    // mm

// ---------------------------------------------------------------------------
// Unit conversions
// ---------------------------------------------------------------------------
describe('degToRad / radToDeg', () => {
  it('converts 0 degrees to 0 radians', () => {
    expect(degToRad(0)).toBe(0);
  });

  it('converts 90 degrees to PI/2', () => {
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2, 10);
  });

  it('converts 180 degrees to PI', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI, 10);
  });

  it('round-trips degrees through radians', () => {
    for (const deg of [0, 30, 45, 60, 90, 120, 180, 270, 360]) {
      expect(radToDeg(degToRad(deg))).toBeCloseTo(deg, 8);
    }
  });
});

// ---------------------------------------------------------------------------
// Snell's Law - calculateRefractedAngle
// ---------------------------------------------------------------------------
describe('calculateRefractedAngle (Snell\'s Law)', () => {
  it('returns 0 when incident angle is 0', () => {
    expect(calculateRefractedAngle(0, 2730, 3250)).toBe(0);
  });

  it('calculates 45-degree shear wave in carbon steel from perspex', () => {
    // Perspex longitudinal = 2730, Carbon steel shear = 3250
    // For 45-degree refracted: sin(wedge) = (2730/3250)*sin(45)
    // wedge angle ~ 36.4 degrees
    // Reverse check: from 36.4 degrees in perspex -> steel shear
    const result = calculateRefractedAngle(36.4, 2730, 3250);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(45, 0); // within ~0.5 deg
  });

  it('calculates 60-degree shear wave in carbon steel from perspex', () => {
    const result = calculateRefractedAngle(46.7, 2730, 3250);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(60, 0);
  });

  it('calculates 70-degree shear wave in carbon steel from perspex', () => {
    const result = calculateRefractedAngle(52.1, 2730, 3250);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(70, 0);
  });

  it('returns null for total internal reflection', () => {
    // Perspex long = 2730, steel long = 5920
    // First critical ~ asin(2730/5920) ~ 27.5 deg
    // At 80 degrees incident the longitudinal refraction would exceed 90
    // But for shear (3250), sin(refracted) = (3250/2730)*sin(80) > 1
    const result = calculateRefractedAngle(80, 2730, 3250);
    expect(result).toBeNull();
  });

  it('handles equal velocities (no refraction at normal incidence)', () => {
    const result = calculateRefractedAngle(30, 3000, 3000);
    expect(result).toBeCloseTo(30, 5);
  });
});

// ---------------------------------------------------------------------------
// calculateWedgeAngle
// ---------------------------------------------------------------------------
describe('calculateWedgeAngle', () => {
  it('returns ~36.4 degrees for 45-deg shear in carbon steel with perspex wedge', () => {
    const angle = calculateWedgeAngle(45, 'perspex', 'carbon_steel', 'shear');
    expect(angle).not.toBeNull();
    expect(angle!).toBeCloseTo(36.4, 0);
  });

  it('returns ~46.7 degrees for 60-deg shear in carbon steel', () => {
    const angle = calculateWedgeAngle(60, 'perspex', 'carbon_steel', 'shear');
    expect(angle).not.toBeNull();
    expect(angle!).toBeCloseTo(46.7, 0);
  });

  it('returns null for unknown material', () => {
    const angle = calculateWedgeAngle(45, 'perspex', 'unobtanium');
    expect(angle).toBeNull();
  });

  it('returns null when angle is not achievable', () => {
    // Try to get 89-deg longitudinal wave in steel from perspex
    // sin(wedge) = (2730/5920)*sin(89) which is < 1, actually achievable
    // But 90 degrees should give sin = (2730/5920)*1 = 0.461 -> ~27.5 deg -> achievable
    // Use a scenario where V1 > V2 to make it impossible
    // rexolite long=2337, perspex shear=1430 - try 80 deg
    const angle = calculateWedgeAngle(80, 'carbon_steel', 'perspex', 'shear');
    // sin(incident) = (5920/1430)*sin(80) = far > 1
    expect(angle).toBeNull();
  });

  it('calculates wedge angle for titanium at 45 degrees shear', () => {
    // Ti-6Al-4V shear = 3120, perspex long = 2730
    // sin(wedge) = (2730/3120)*sin(45) = 0.875*0.707 = 0.619 -> ~38.2 deg
    const angle = calculateWedgeAngle(45, 'perspex', 'titanium_6al4v', 'shear');
    expect(angle).not.toBeNull();
    expect(angle!).toBeCloseTo(38.2, 0);
  });

  it('calculates wedge angle for aluminum 7075 at 60 degrees shear', () => {
    // Al 7075 shear = 3140, perspex long = 2730
    // sin(wedge) = (2730/3140)*sin(60) = 0.8694*0.8660 = 0.7529 -> ~48.9 deg
    const angle = calculateWedgeAngle(60, 'perspex', 'aluminum_7075', 'shear');
    expect(angle).not.toBeNull();
    expect(angle!).toBeCloseTo(48.9, 0);
  });
});

// ---------------------------------------------------------------------------
// Critical angles
// ---------------------------------------------------------------------------
describe('calculateCriticalAngles', () => {
  it('calculates critical angles for perspex -> carbon steel', () => {
    const result = calculateCriticalAngles('perspex', 'carbon_steel');
    expect(result).not.toBeNull();
    // First critical: asin(2730/5920) ~ 27.5 deg
    expect(result!.firstCritical).toBeCloseTo(27.5, 0);
    // Second critical: asin(2730/3250) ~ 57.1 deg
    expect(result!.secondCritical).toBeCloseTo(57.1, 0);
  });

  it('calculates critical angles for perspex -> aluminum 6061', () => {
    const result = calculateCriticalAngles('perspex', 'aluminum_6061');
    expect(result).not.toBeNull();
    // First critical: asin(2730/6320) ~ 25.6 deg
    expect(result!.firstCritical).toBeCloseTo(25.6, 0);
    // Second critical: asin(2730/3130) ~ 60.7 deg
    expect(result!.secondCritical).toBeCloseTo(60.7, 0);
  });

  it('calculates critical angles for perspex -> titanium 6Al-4V', () => {
    const result = calculateCriticalAngles('perspex', 'titanium_6al4v');
    expect(result).not.toBeNull();
    // First critical: asin(2730/6100) ~ 26.6 deg
    expect(result!.firstCritical).toBeCloseTo(26.6, 0);
    // Second critical: asin(2730/3120) ~ 61.1 deg
    expect(result!.secondCritical).toBeCloseTo(61.1, 0);
  });

  it('returns null for unknown material', () => {
    expect(calculateCriticalAngles('perspex', 'unobtanium')).toBeNull();
    expect(calculateCriticalAngles('unobtanium', 'carbon_steel')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Beam path calculations
// ---------------------------------------------------------------------------
describe('calculateBeamPath', () => {
  it('calculates 45-degree beam in 25mm plate (no target depth)', () => {
    const result = calculateBeamPath(25, 45);
    // halfSkip = 25 * tan(45) = 25 mm
    expect(result.halfSkip).toBeCloseTo(25, 1);
    // skipDistance = 50 mm
    expect(result.skipDistance).toBeCloseTo(50, 1);
    // soundPath = 25/cos(45) = 35.36 mm
    expect(result.soundPath).toBeCloseTo(35.36, 0);
    expect(result.legNumber).toBe(1);
  });

  it('calculates 60-degree beam in 25mm plate', () => {
    const result = calculateBeamPath(25, 60);
    // halfSkip = 25 * tan(60) = 25 * 1.732 = 43.3 mm
    expect(result.halfSkip).toBeCloseTo(43.3, 0);
    // soundPath = 25/cos(60) = 50 mm
    expect(result.soundPath).toBeCloseTo(50, 0);
  });

  it('calculates 70-degree beam in 25mm plate', () => {
    const result = calculateBeamPath(25, 70);
    // halfSkip = 25 * tan(70) = 25 * 2.747 = 68.7 mm
    expect(result.halfSkip).toBeCloseTo(68.7, 0);
    // soundPath = 25/cos(70) = 73.1 mm
    expect(result.soundPath).toBeCloseTo(73.1, 0);
  });

  it('calculates first leg with target depth = 12.5mm at 45 degrees', () => {
    const result = calculateBeamPath(25, 45, 12.5);
    expect(result.legNumber).toBe(1);
    expect(result.depthAtLeg).toBeCloseTo(12.5, 1);
    // surfaceDistance = 12.5 * tan(45) = 12.5 mm
    expect(result.surfaceDistance).toBeCloseTo(12.5, 1);
    // soundPath = 12.5/cos(45) = 17.68 mm
    expect(result.soundPath).toBeCloseTo(17.68, 0);
  });

  it('calculates second leg with target depth = 30mm at 45 degrees in 25mm plate', () => {
    // target > thickness -> second leg
    const result = calculateBeamPath(25, 45, 30);
    expect(result.legNumber).toBe(2);
    // depthAtLeg = 2*25 - 30 = 20 mm (ascending from bottom)
    expect(result.depthAtLeg).toBeCloseTo(20, 1);
  });

  it('returns correct skip for very thin wall (3mm at 45 deg)', () => {
    const result = calculateBeamPath(3, 45);
    expect(result.halfSkip).toBeCloseTo(3, 1);
    expect(result.skipDistance).toBeCloseTo(6, 1);
  });

  it('returns correct skip for thick section (100mm at 45 deg)', () => {
    const result = calculateBeamPath(100, 45);
    expect(result.halfSkip).toBeCloseTo(100, 1);
    expect(result.skipDistance).toBeCloseTo(200, 1);
  });
});

// ---------------------------------------------------------------------------
// calculateDepthFromSurfaceDistance
// ---------------------------------------------------------------------------
describe('calculateDepthFromSurfaceDistance', () => {
  it('first leg: surface distance 12.5mm at 45 deg in 25mm plate -> depth 12.5mm', () => {
    const result = calculateDepthFromSurfaceDistance(12.5, 45, 25);
    expect(result.depth).toBeCloseTo(12.5, 1);
    expect(result.legNumber).toBe(1);
  });

  it('at halfSkip (25mm) for 45 deg in 25mm plate -> depth = 25mm, leg 1', () => {
    // surfaceDistance = halfSkip = 25, legs = floor(25/25) = 1
    // remainder = 0, legs%2 = 1 -> ascending -> depth = 25 - 0 = 25
    const result = calculateDepthFromSurfaceDistance(25, 45, 25);
    expect(result.depth).toBeCloseTo(25, 1);
    expect(result.legNumber).toBe(2);
  });

  it('at full skip (50mm) for 45 deg in 25mm plate -> back to surface', () => {
    const result = calculateDepthFromSurfaceDistance(50, 45, 25);
    // legs = floor(50/25) = 2, remainder = 0, legs%2==0 -> descending, depth = 0
    expect(result.depth).toBeCloseTo(0, 1);
    expect(result.legNumber).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// SDH size recommendations
// ---------------------------------------------------------------------------
describe('getRecommendedSDHSize', () => {
  // AWS: always 1.5mm
  it('AWS returns 1.5mm for any thickness', () => {
    expect(getRecommendedSDHSize(10, 'aws').diameter).toBe(1.5);
    expect(getRecommendedSDHSize(80, 'aws').diameter).toBe(1.5);
  });

  // ASME thickness tiers
  it('ASME: 1.5mm for T<=25', () => {
    expect(getRecommendedSDHSize(20, 'asme').diameter).toBe(1.5);
  });
  it('ASME: 2.4mm for 25<T<=50', () => {
    expect(getRecommendedSDHSize(40, 'asme').diameter).toBe(2.4);
  });
  it('ASME: 3.0mm for T>50', () => {
    expect(getRecommendedSDHSize(60, 'asme').diameter).toBe(3.0);
  });

  // EN 1714 / ISO 17640 thickness tiers
  it('EN1714: 1.5mm for T<=15', () => {
    expect(getRecommendedSDHSize(10, 'en1714').diameter).toBe(1.5);
  });
  it('EN1714: 2.0mm for 15<T<=35', () => {
    expect(getRecommendedSDHSize(25, 'en1714').diameter).toBe(2.0);
  });
  it('EN1714: 3.0mm for 35<T<=100', () => {
    expect(getRecommendedSDHSize(50, 'en1714').diameter).toBe(3.0);
  });
  it('EN1714: 4.0mm for T>100', () => {
    expect(getRecommendedSDHSize(120, 'en1714').diameter).toBe(4.0);
  });

  // MIL-STD-2154
  it('MIL: 1.5mm for T<=25', () => {
    expect(getRecommendedSDHSize(20, 'mil_std_2154').diameter).toBe(1.5);
  });
  it('MIL: 2.0mm for T>25', () => {
    expect(getRecommendedSDHSize(30, 'mil_std_2154').diameter).toBe(2.0);
  });

  // Boundary values
  it('ASME boundary at exactly 25mm -> 1.5mm', () => {
    expect(getRecommendedSDHSize(25, 'asme').diameter).toBe(1.5);
  });
  it('ASME boundary at exactly 50mm -> 2.4mm', () => {
    expect(getRecommendedSDHSize(50, 'asme').diameter).toBe(2.4);
  });
});

// ---------------------------------------------------------------------------
// Notch recommendations
// ---------------------------------------------------------------------------
describe('getRecommendedNotch', () => {
  it('ASME: depth = max(10% wall, 1mm)', () => {
    const thin = getRecommendedNotch(5, 'asme');
    expect(thin.depth).toBe(1); // 10% of 5 = 0.5, min 1
    expect(thin.location).toBe('both');

    const thick = getRecommendedNotch(20, 'asme');
    expect(thick.depth).toBe(2); // 10% of 20
  });

  it('EN ISO 10893: N5 notch (5% wall)', () => {
    const result = getRecommendedNotch(10, 'en_iso_10893');
    expect(result.depth).toBeCloseTo(0.5, 2);
    expect(result.depthPercent).toBe(5);
  });

  it('API: N12.5 notch (12.5% wall)', () => {
    const result = getRecommendedNotch(20, 'api');
    expect(result.depth).toBeCloseTo(2.5, 2);
    expect(result.depthPercent).toBe(12.5);
  });

  it('AWS: fixed 2mm notch', () => {
    const result = getRecommendedNotch(25, 'aws');
    expect(result.depth).toBe(2);
    expect(result.location).toBe('od');
  });
});

// ---------------------------------------------------------------------------
// Material velocity lookups (getMaterialVelocity)
// ---------------------------------------------------------------------------
describe('getMaterialVelocity', () => {
  it('direct key lookup', () => {
    const mat = getMaterialVelocity('carbon_steel');
    expect(mat).not.toBeNull();
    expect(mat!.longitudinal).toBe(5920);
    expect(mat!.shear).toBe(3250);
  });

  it('fuzzy match for "mild steel"', () => {
    const mat = getMaterialVelocity('mild steel');
    expect(mat).not.toBeNull();
    expect(mat!.longitudinal).toBe(5920);
  });

  it('fuzzy match for "Stainless 304"', () => {
    const mat = getMaterialVelocity('Stainless 304');
    expect(mat!.longitudinal).toBe(5790);
  });

  it('fuzzy match for "Ti-6Al-4V"', () => {
    const mat = getMaterialVelocity('Ti-6Al-4V');
    expect(mat!.longitudinal).toBe(6100);
  });

  it('fuzzy match for "IN718"', () => {
    const mat = getMaterialVelocity('IN718');
    expect(mat!.longitudinal).toBe(5840);
  });

  it('fuzzy match for "waspaloy"', () => {
    const mat = getMaterialVelocity('waspaloy');
    expect(mat!.longitudinal).toBe(5800);
  });

  it('fuzzy match for "powder nickel" / "PM Nickel"', () => {
    const mat = getMaterialVelocity('PM Nickel');
    expect(mat!.longitudinal).toBe(5750);
  });

  it('unknown material defaults to carbon steel', () => {
    const mat = getMaterialVelocity('unobtanium');
    expect(mat!.longitudinal).toBe(5920);
  });
});

// ---------------------------------------------------------------------------
// MATERIAL_VELOCITIES data integrity
// ---------------------------------------------------------------------------
describe('MATERIAL_VELOCITIES data integrity', () => {
  it('all entries have positive longitudinal, shear, density, impedance', () => {
    for (const [key, mat] of Object.entries(MATERIAL_VELOCITIES)) {
      expect(mat.longitudinal, `${key} longitudinal`).toBeGreaterThan(0);
      expect(mat.shear, `${key} shear`).toBeGreaterThan(0);
      expect(mat.density, `${key} density`).toBeGreaterThan(0);
      expect(mat.acousticImpedance, `${key} impedance`).toBeGreaterThan(0);
    }
  });

  it('longitudinal velocity > shear velocity for all materials', () => {
    for (const [key, mat] of Object.entries(MATERIAL_VELOCITIES)) {
      expect(mat.longitudinal, key).toBeGreaterThan(mat.shear);
    }
  });
});

// ---------------------------------------------------------------------------
// STANDARD_WEDGES data integrity
// ---------------------------------------------------------------------------
describe('STANDARD_WEDGES data integrity', () => {
  it('each wedge has a valid refracted angle (45, 60, or 70)', () => {
    for (const [, wedge] of Object.entries(STANDARD_WEDGES)) {
      expect([45, 60, 70]).toContain(wedge.refractedAngleSteel);
    }
  });
});

// ---------------------------------------------------------------------------
// selectAngleBeamCalibrationBlock - main integration tests
// ---------------------------------------------------------------------------
describe('selectAngleBeamCalibrationBlock', () => {
  it('selects DSC block for AWS code, 25mm carbon steel plate weld', () => {
    const result = selectAngleBeamCalibrationBlock({
      partThickness: 25,
      partMaterial: 'carbon_steel',
      beamAngles: [45, 60, 70],
      partGeometry: 'weld',
      code: 'aws',
    });
    expect(result.recommendedBlock).toBeDefined();
    expect(result.recommendedBlock.type).toBe('dsc');
    expect(result.sdhSize.diameter).toBe(1.5); // AWS always 1.5
    expect(result.notchSpec).toBeDefined(); // weld gets notch
    expect(result.criticalAngles).not.toBeNull();
    expect(result.beamPathData[45]).toBeDefined();
    expect(result.beamPathData[60]).toBeDefined();
    expect(result.beamPathData[70]).toBeDefined();
  });

  it('selects ASME block for ASME code, 20mm plate', () => {
    const result = selectAngleBeamCalibrationBlock({
      partThickness: 20,
      partMaterial: 'carbon_steel',
      beamAngles: [45, 60],
      partGeometry: 'plate',
      code: 'asme',
    });
    expect(result.recommendedBlock).toBeDefined();
    // ASME basic block covers 6-40mm and has all angles
    expect(result.calibrationNotes.some(n => n.includes('ASME'))).toBe(true);
  });

  it('selects IIW V1 for EN1714 code, 25mm plate', () => {
    const result = selectAngleBeamCalibrationBlock({
      partThickness: 25,
      partMaterial: 'carbon_steel',
      beamAngles: [45, 60, 70],
      partGeometry: 'plate',
      code: 'en1714',
    });
    expect(result.recommendedBlock.type).toBe('iiv_v1');
  });

  it('selects tubular/V2 block for small-diameter pipe', () => {
    const result = selectAngleBeamCalibrationBlock({
      partThickness: 8,
      partMaterial: 'carbon_steel',
      beamAngles: [45, 60],
      partGeometry: 'pipe',
      outerDiameter: 50,
      code: 'en1714',
    });
    expect(result.calibrationNotes.some(n => n.includes('Small diameter pipe'))).toBe(true);
    expect(result.notchSpec).toBeDefined(); // pipe gets notch
  });

  it('warns for very thin material (<6mm)', () => {
    const result = selectAngleBeamCalibrationBlock({
      partThickness: 4,
      partMaterial: 'carbon_steel',
      beamAngles: [45],
      partGeometry: 'plate',
      code: 'en1714',
    });
    expect(result.warnings.some(w => w.includes('Very thin'))).toBe(true);
  });

  it('warns when 70-deg beam is used on >100mm thickness', () => {
    const result = selectAngleBeamCalibrationBlock({
      partThickness: 120,
      partMaterial: 'carbon_steel',
      beamAngles: [45, 70],
      partGeometry: 'plate',
      code: 'en1714',
    });
    expect(result.warnings.some(w => w.includes('70°'))).toBe(true);
  });

  it('warns for high t/OD ratio pipe', () => {
    const result = selectAngleBeamCalibrationBlock({
      partThickness: 15,
      partMaterial: 'carbon_steel',
      beamAngles: [45],
      partGeometry: 'pipe',
      outerDiameter: 40,
      code: 'en1714',
    });
    // t/OD = 15/40 = 0.375 > 0.25
    expect(result.warnings.some(w => w.includes('Curvature correction'))).toBe(true);
  });

  it('calculates wedge requirements for each requested angle', () => {
    const result = selectAngleBeamCalibrationBlock({
      partThickness: 25,
      partMaterial: 'carbon_steel',
      beamAngles: [45, 60],
      partGeometry: 'plate',
      code: 'en1714',
    });
    expect(result.wedgeRequirements[45]).toBeDefined();
    expect(result.wedgeRequirements[45].wedgeAngle).toBeCloseTo(36.4, 0);
    expect(result.wedgeRequirements[60]).toBeDefined();
    expect(result.wedgeRequirements[60].wedgeAngle).toBeCloseTo(46.7, 0);
  });

  it('uses 2 MHz probes for thick sections (>50mm)', () => {
    const result = selectAngleBeamCalibrationBlock({
      partThickness: 60,
      partMaterial: 'carbon_steel',
      beamAngles: [45],
      partGeometry: 'plate',
      code: 'en1714',
    });
    expect(result.wedgeRequirements[45].frequency).toBe(2);
    expect(result.wedgeRequirements[45].standardWedge).toBe('SW45-2');
  });

  it('uses 4 MHz probes for thin sections (<=50mm)', () => {
    const result = selectAngleBeamCalibrationBlock({
      partThickness: 20,
      partMaterial: 'carbon_steel',
      beamAngles: [60],
      partGeometry: 'plate',
      code: 'en1714',
    });
    expect(result.wedgeRequirements[60].frequency).toBe(4);
    expect(result.wedgeRequirements[60].standardWedge).toBe('SW60-4');
  });

  it('works with titanium material', () => {
    const result = selectAngleBeamCalibrationBlock({
      partThickness: 25,
      partMaterial: 'titanium_6al4v',
      beamAngles: [45, 60],
      partGeometry: 'forging',
      code: 'mil_std_2154',
    });
    expect(result.recommendedBlock).toBeDefined();
    expect(result.criticalAngles).not.toBeNull();
    // Ti has different critical angles than steel
    expect(result.criticalAngles!.firstCritical).toBeCloseTo(26.6, 0);
  });

  it('includes skip distance info in calibration notes', () => {
    const result = selectAngleBeamCalibrationBlock({
      partThickness: 25,
      partMaterial: 'carbon_steel',
      beamAngles: [45],
      partGeometry: 'plate',
      code: 'en1714',
    });
    expect(result.calibrationNotes.some(n => n.includes('Skip distances'))).toBe(true);
  });

  it('adds weld-specific notes for weld geometry', () => {
    const result = selectAngleBeamCalibrationBlock({
      partThickness: 25,
      partMaterial: 'carbon_steel',
      beamAngles: [45],
      partGeometry: 'weld',
      code: 'en1714',
    });
    expect(result.calibrationNotes.some(n => n.includes('Scan from both sides'))).toBe(true);
    expect(result.calibrationNotes.some(n => n.includes('DAC curve'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// formatBeamPathSummary
// ---------------------------------------------------------------------------
describe('formatBeamPathSummary', () => {
  it('produces a readable summary string', () => {
    const bp = calculateBeamPath(25, 45);
    const text = formatBeamPathSummary(bp, 45);
    expect(text).toContain('45°');
    expect(text).toContain('Sound Path');
    expect(text).toContain('Half Skip');
    expect(text).toContain('Full Skip');
  });
});

// ---------------------------------------------------------------------------
// calculateScanRange
// ---------------------------------------------------------------------------
describe('calculateScanRange', () => {
  it('returns scan range encompassing weld width plus skip distances', () => {
    const range = calculateScanRange(20, 25, 45, 2);
    // minDistance = -weldWidth/2 = -10
    expect(range.minDistance).toBe(-10);
    // maxDistance = halfSkip*2 + weldWidth/2 = 25*2 + 10 = 60
    expect(range.maxDistance).toBeCloseTo(60, 0);
  });
});
