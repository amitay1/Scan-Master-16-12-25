import { describe, it, expect } from 'vitest';
import {
  getRecommendedFrequency,
  calculateMetalTravel,
  getCouplantRecommendation,
  getResolutionValues,
  calculateScanIndex,
  materialDatabase,
  standardRules,
  getSmartRecommendation,
} from '@/utils/enhancedAutoFillLogic';

// =============================================================================
// 1. getRecommendedFrequency
// =============================================================================
describe('getRecommendedFrequency', () => {
  // --- Aluminum (attenuation 1.5, factor 1.0 -- no adjustment) ---
  it('returns 10.0 MHz for thin aluminum (10mm)', () => {
    expect(getRecommendedFrequency(10, 'aluminum')).toBe('10.0');
  });

  it('returns 5.0 MHz for mid aluminum (20mm)', () => {
    expect(getRecommendedFrequency(20, 'aluminum')).toBe('5.0');
  });

  it('returns 2.25 MHz for thick aluminum (40mm)', () => {
    expect(getRecommendedFrequency(40, 'aluminum')).toBe('2.25');
  });

  it('returns 1.0 MHz for very thick aluminum (60mm)', () => {
    expect(getRecommendedFrequency(60, 'aluminum')).toBe('1.0');
  });

  // --- Steel (attenuation 3.0, factor 1.0) ---
  it('returns 10.0 MHz for thin steel (5mm)', () => {
    expect(getRecommendedFrequency(5, 'steel')).toBe('10.0');
  });

  it('returns 5.0 MHz for 15mm steel', () => {
    expect(getRecommendedFrequency(15, 'steel')).toBe('5.0');
  });

  // --- Titanium (attenuation 4.5, factor 0.75) ---
  // adjustedThickness = thickness / 0.75
  it('returns 10.0 MHz for thin titanium (8mm) -- adjusted 10.67', () => {
    expect(getRecommendedFrequency(8, 'titanium')).toBe('10.0');
  });

  it('returns 5.0 MHz for 10mm titanium -- adjusted 13.33', () => {
    expect(getRecommendedFrequency(10, 'titanium')).toBe('5.0');
  });

  it('returns 2.25 MHz for 25mm titanium -- adjusted 33.33', () => {
    expect(getRecommendedFrequency(25, 'titanium')).toBe('2.25');
  });

  it('returns 1.0 MHz for 50mm titanium -- adjusted 66.67', () => {
    expect(getRecommendedFrequency(50, 'titanium')).toBe('1.0');
  });

  // --- Magnesium (attenuation 8.0, factor 0.5) ---
  // adjustedThickness = thickness / 0.5 = thickness * 2
  it('returns 10.0 MHz for very thin magnesium (5mm) -- adjusted 10', () => {
    expect(getRecommendedFrequency(5, 'magnesium')).toBe('10.0');
  });

  it('returns 5.0 MHz for 7mm magnesium -- adjusted 14', () => {
    expect(getRecommendedFrequency(7, 'magnesium')).toBe('5.0');
  });

  it('returns 2.25 MHz for 15mm magnesium -- adjusted 30', () => {
    expect(getRecommendedFrequency(15, 'magnesium')).toBe('2.25');
  });

  it('returns 1.0 MHz for 30mm magnesium -- adjusted 60', () => {
    expect(getRecommendedFrequency(30, 'magnesium')).toBe('1.0');
  });

  // --- No material specified (factor 1.0) ---
  it('returns 10.0 MHz for 10mm with no material', () => {
    expect(getRecommendedFrequency(10)).toBe('10.0');
  });

  // --- Boundary: exactly 12.7mm aluminum (factor 1.0) ---
  it('returns 5.0 MHz at exactly 12.7mm (boundary)', () => {
    expect(getRecommendedFrequency(12.7, 'aluminum')).toBe('5.0');
  });
});

// =============================================================================
// 2. calculateMetalTravel
// =============================================================================
describe('calculateMetalTravel', () => {
  it('returns 15 for 5mm thickness (5*3=15, rounded to nearest 5)', () => {
    expect(calculateMetalTravel(5)).toBe(15);
  });

  it('returns 75 for 25mm thickness (75, already multiple of 5)', () => {
    expect(calculateMetalTravel(25)).toBe(75);
  });

  it('returns 30 for 10mm thickness', () => {
    expect(calculateMetalTravel(10)).toBe(30);
  });

  it('returns 150 for 50mm thickness', () => {
    expect(calculateMetalTravel(50)).toBe(150);
  });

  it('rounds to nearest 5 for non-round results (7mm -> 21 -> 20)', () => {
    expect(calculateMetalTravel(7)).toBe(20);
  });

  it('rounds 8mm -> 24 -> 25', () => {
    expect(calculateMetalTravel(8)).toBe(25);
  });

  it('handles very thin (1mm -> 3 -> 5)', () => {
    expect(calculateMetalTravel(1)).toBe(5);
  });

  it('handles very thick (200mm -> 600)', () => {
    expect(calculateMetalTravel(200)).toBe(600);
  });
});

// =============================================================================
// 3. getCouplantRecommendation
// =============================================================================
describe('getCouplantRecommendation', () => {
  it('returns distilled water for immersion', () => {
    expect(getCouplantRecommendation('immersion')).toBe('Water (distilled or deionized)');
  });

  it('returns heated water for immersion above 40C', () => {
    expect(getCouplantRecommendation('immersion', undefined, 50)).toBe(
      'Water with rust inhibitor (heated)'
    );
  });

  it('returns distilled water for immersion at exactly 40C (not >40)', () => {
    expect(getCouplantRecommendation('immersion', undefined, 40)).toBe(
      'Water (distilled or deionized)'
    );
  });

  it('returns non-corrosive gel for magnesium contact', () => {
    expect(getCouplantRecommendation('contact', 'magnesium')).toContain('non-corrosive');
    expect(getCouplantRecommendation('contact', 'magnesium')).toContain('CRITICAL');
  });

  it('returns commercial gel for contact on steel', () => {
    expect(getCouplantRecommendation('contact', 'steel')).toContain('Sono 600');
  });

  it('returns commercial gel for contact with no material', () => {
    expect(getCouplantRecommendation('contact')).toContain('ultrasonic gel');
  });

  // Immersion takes precedence over magnesium special case
  it('returns water for immersion even with magnesium', () => {
    expect(getCouplantRecommendation('immersion', 'magnesium')).toBe(
      'Water (distilled or deionized)'
    );
  });
});

// =============================================================================
// 4. getResolutionValues
// =============================================================================
describe('getResolutionValues', () => {
  it('returns correct values for 1.0 MHz', () => {
    expect(getResolutionValues('1.0')).toEqual({ entry: 0.5, back: 0.2 });
  });

  it('returns correct values for 2.25 MHz', () => {
    expect(getResolutionValues('2.25')).toEqual({ entry: 0.25, back: 0.1 });
  });

  it('returns correct values for 5.0 MHz', () => {
    expect(getResolutionValues('5.0')).toEqual({ entry: 0.125, back: 0.05 });
  });

  it('returns correct values for 10.0 MHz', () => {
    expect(getResolutionValues('10.0')).toEqual({ entry: 0.05, back: 0.025 });
  });

  it('returns correct values for 15.0 MHz', () => {
    expect(getResolutionValues('15.0')).toEqual({ entry: 0.05, back: 0.025 });
  });

  it('returns default (5.0 MHz values) for unknown frequency', () => {
    expect(getResolutionValues('3.5')).toEqual({ entry: 0.125, back: 0.05 });
  });
});

// =============================================================================
// 5. calculateScanIndex
// =============================================================================
describe('calculateScanIndex', () => {
  // Formula: indexInches = diameter * (2 - coveragePercent/100)
  // Result in mm, rounded to 1 decimal

  it('returns correct index for 0.5" transducer at 100% coverage', () => {
    // 0.5 * (2 - 1) = 0.5" = 12.7mm
    expect(calculateScanIndex(0.5, 100)).toBe(12.7);
  });

  it('returns correct index for 1.0" transducer at 100% coverage', () => {
    // 1.0 * 1 = 1.0" = 25.4mm
    expect(calculateScanIndex(1.0, 100)).toBe(25.4);
  });

  it('returns correct index for 0.75" transducer at 50% coverage', () => {
    // 0.75 * (2 - 0.5) = 0.75 * 1.5 = 1.125" = 28.575 -> 28.6mm
    expect(calculateScanIndex(0.75, 50)).toBe(28.6);
  });

  it('defaults to 100% coverage when not specified', () => {
    expect(calculateScanIndex(0.5)).toBe(12.7);
  });

  it('handles 200% coverage (full overlap)', () => {
    // diameter * (2 - 2) = 0
    expect(calculateScanIndex(1.0, 200)).toBe(0);
  });
});

// =============================================================================
// 6. materialDatabase -- verify all 7 materials
// =============================================================================
describe('materialDatabase', () => {
  const expectedMaterials = [
    'aluminum', 'steel', 'stainless_steel', 'titanium',
    'magnesium', 'nickel_alloy', 'custom',
  ] as const;

  it('contains exactly 7 materials', () => {
    expect(Object.keys(materialDatabase)).toHaveLength(7);
  });

  it.each(expectedMaterials)('contains %s with all required properties', (mat) => {
    const props = materialDatabase[mat];
    expect(props).toBeDefined();
    expect(props.velocity).toBeGreaterThan(0);
    expect(props.velocityShear).toBeGreaterThan(0);
    expect(props.acousticImpedance).toBeGreaterThan(0);
    expect(props.density).toBeGreaterThan(0);
    expect(props.attenuation).toBeGreaterThan(0);
    expect(typeof props.surfaceCondition).toBe('string');
    expect(props.typicalSpecs.length).toBeGreaterThan(0);
  });

  // Spot-check specific values
  it('aluminum velocity is 6.32 mm/us', () => {
    expect(materialDatabase.aluminum.velocity).toBe(6.32);
  });

  it('steel acoustic impedance is 46.5 MRayl', () => {
    expect(materialDatabase.steel.acousticImpedance).toBe(46.5);
  });

  it('titanium density is 4.5 g/cm3', () => {
    expect(materialDatabase.titanium.density).toBe(4.5);
  });

  it('magnesium attenuation is 8.0 dB/m (highest)', () => {
    expect(materialDatabase.magnesium.attenuation).toBe(8.0);
    // Verify it is the highest
    for (const mat of expectedMaterials) {
      expect(materialDatabase.magnesium.attenuation).toBeGreaterThanOrEqual(
        materialDatabase[mat].attenuation
      );
    }
  });

  it('nickel_alloy velocity is 5.82 mm/us', () => {
    expect(materialDatabase.nickel_alloy.velocity).toBe(5.82);
  });
});

// =============================================================================
// 7. standardRules -- verify key standards
// =============================================================================
describe('standardRules', () => {
  it('contains key standards', () => {
    expect(Object.keys(standardRules).length).toBeGreaterThanOrEqual(5);
    expect(standardRules).toHaveProperty('MIL-STD-2154');
    expect(standardRules).toHaveProperty('AMS-STD-2154E');
    expect(standardRules).toHaveProperty('ASTM-A388');
  });

  it('MIL-STD-2154 defaults to class A', () => {
    expect(standardRules['MIL-STD-2154'].defaultAcceptanceClass).toBe('A');
  });

  it('AMS-STD-2154E defaults to class A', () => {
    expect(standardRules['AMS-STD-2154E'].defaultAcceptanceClass).toBe('A');
  });

  it('ASTM-A388 defaults to class B', () => {
    expect(standardRules['ASTM-A388'].defaultAcceptanceClass).toBe('B');
  });

  it('ASTM-A388 has minThickness of 25.4mm (1 inch)', () => {
    expect(standardRules['ASTM-A388'].minThickness).toBe(25.4);
  });

  it('all standards have 100% scan coverage default', () => {
    for (const key of Object.keys(standardRules)) {
      expect(standardRules[key as keyof typeof standardRules].scanCoverageDefault).toBe(100);
    }
  });

  it('BS-EN-10228-3 defaults to class A with minThickness 10mm', () => {
    expect(standardRules['BS-EN-10228-3'].defaultAcceptanceClass).toBe('A');
    expect(standardRules['BS-EN-10228-3'].minThickness).toBe(10);
  });

  it('BS-EN-10228-4 defaults to class A with minThickness 20mm', () => {
    expect(standardRules['BS-EN-10228-4'].defaultAcceptanceClass).toBe('A');
    expect(standardRules['BS-EN-10228-4'].minThickness).toBe(20);
  });
});

// =============================================================================
// 8. getSmartRecommendation
// =============================================================================
describe('getSmartRecommendation', () => {
  // --- Plate geometry ---
  it('returns plate scan directions for a plate', () => {
    const rec = getSmartRecommendation({
      geometry: 'plate',
      material: 'aluminum',
      thickness: 25,
    });
    expect(rec.geometry).toBe('plate');
    expect(rec.recommendations.scanDirections).toContain('Straight beam perpendicular to surface');
    expect(rec.recommendations.acceptanceClass).toBe('A'); // default
  });

  it('warns when plate W/T <= 5', () => {
    const rec = getSmartRecommendation({
      geometry: 'plate',
      material: 'steel',
      thickness: 20,
      width: 80, // W/T = 4
    });
    const wtWarning = rec.recommendations.warnings.find((w) => w.includes('W/T'));
    expect(wtWarning).toBeDefined();
    expect(wtWarning).toContain('rectangular bar');
  });

  it('does not warn when plate W/T > 5', () => {
    const rec = getSmartRecommendation({
      geometry: 'plate',
      material: 'steel',
      thickness: 10,
      width: 100, // W/T = 10
    });
    const wtWarning = rec.recommendations.warnings.find((w) => w.includes('W/T'));
    expect(wtWarning).toBeUndefined();
  });

  it('warns when dimension exceeds 228.6mm', () => {
    const rec = getSmartRecommendation({
      geometry: 'plate',
      material: 'aluminum',
      thickness: 250,
      width: 100,
    });
    const dimWarning = rec.recommendations.warnings.find((w) => w.includes('228.6'));
    expect(dimWarning).toBeDefined();
  });

  // --- Ring forging L/T ratio ---
  it('ring_forging warns and requires axial scan when L/T < 5', () => {
    const rec = getSmartRecommendation({
      geometry: 'ring_forging',
      material: 'steel',
      thickness: 30,
      length: 100, // L/T = 3.33
    });
    const ltWarning = rec.recommendations.warnings.find((w) => w.includes('L/T'));
    expect(ltWarning).toBeDefined();
    expect(ltWarning).toContain('Axial scanning IS REQUIRED');
    // Conditions come from static GEOMETRY_INSPECTION_RULES
    // Dynamic condition added when L/T < 5
    const hasRequired = rec.recommendations.conditions.some(
      (c: string) => c.includes('REQUIRED') && c.includes('Axial')
    );
    expect(hasRequired).toBe(true);
  });

  it('ring_forging does not require axial scan when L/T >= 5', () => {
    const rec = getSmartRecommendation({
      geometry: 'ring_forging',
      material: 'steel',
      thickness: 20,
      length: 200, // L/T = 10
    });
    const ltWarning = rec.recommendations.warnings.find((w) => w.includes('L/T'));
    expect(ltWarning).toBeUndefined();
    // Dynamic condition: axial not required
    const hasNotRequired = rec.recommendations.conditions.some(
      (c: string) => c.includes('not required')
    );
    expect(hasNotRequired).toBe(true);
  });

  it('ring_forging warns when thickness > 20% of OD', () => {
    const rec = getSmartRecommendation({
      geometry: 'ring_forging',
      material: 'steel',
      thickness: 30,
      diameter: 100, // 30% of OD
    });
    const odWarning = rec.recommendations.warnings.find((w) => w.includes('20%'));
    expect(odWarning).toBeDefined();
  });

  // --- Titanium warnings ---
  it('titanium class AAA triggers special warning', () => {
    const rec = getSmartRecommendation({
      geometry: 'plate',
      material: 'titanium',
      thickness: 25,
      acceptanceClass: 'AAA',
    });
    const tiWarning = rec.recommendations.warnings.find((w) => w.includes('TITANIUM ALERT'));
    expect(tiWarning).toBeDefined();
  });

  it('titanium class A does NOT trigger special warning', () => {
    const rec = getSmartRecommendation({
      geometry: 'plate',
      material: 'titanium',
      thickness: 25,
      acceptanceClass: 'A',
    });
    const tiWarning = rec.recommendations.warnings.find((w) => w.includes('TITANIUM ALERT'));
    expect(tiWarning).toBeUndefined();
  });

  // --- Magnesium warning ---
  it('magnesium always triggers couplant warning', () => {
    const rec = getSmartRecommendation({
      geometry: 'plate',
      material: 'magnesium',
      thickness: 10,
    });
    const mgWarning = rec.recommendations.warnings.find((w) => w.includes('Magnesium'));
    expect(mgWarning).toBeDefined();
    expect(mgWarning).toContain('non-corrosive');
  });

  // --- Frequency is included ---
  it('includes a frequency recommendation', () => {
    const rec = getSmartRecommendation({
      geometry: 'cylinder',
      material: 'aluminum',
      thickness: 20,
    });
    expect(rec.recommendations.frequency).toBe('5.0');
  });

  // --- Default acceptance class ---
  it('defaults acceptance class to A when not specified', () => {
    const rec = getSmartRecommendation({
      geometry: 'plate',
      material: 'steel',
      thickness: 25,
    });
    expect(rec.recommendations.acceptanceClass).toBe('A');
  });
});
