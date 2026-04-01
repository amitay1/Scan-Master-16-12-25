import { describe, expect, it } from 'vitest';
import {
  AMS_2154_DEFAULT_WATER_VELOCITY,
  calculateAms2154CylindricalOffset,
  calculateAms2154IncidentAngle,
} from '@/utils/ams2154ImmersionCalculator';
import {
  PW_HPT_TRANSDUCER_SETUP,
  PW_REFERENCE_REFRACTED_ANGLE,
  PW_REFERENCE_SHEAR_VELOCITY,
} from '@/rules/pw/pwTransducers';
import { PW_V2500_PARTS } from '@/rules/pw/pwRuleSet';
import {
  PW_V2500_STAGE1_SCAN_PLAN,
  PW_V2500_STAGE2_SCAN_PLAN,
} from '@/rules/pw/pwScanPlans';

describe('ams2154ImmersionCalculator', () => {
  it('calculates the Figure 10 incident angle for the PW 45-degree setup', () => {
    const incidentAngle = calculateAms2154IncidentAngle(
      PW_REFERENCE_REFRACTED_ANGLE,
      PW_REFERENCE_SHEAR_VELOCITY,
      AMS_2154_DEFAULT_WATER_VELOCITY
    );

    expect(incidentAngle).toBeCloseTo(18.905, 3);
    expect(PW_HPT_TRANSDUCER_SETUP.incidentAngle).toBeCloseTo(18.9, 1);
  });

  it('calculates the published Stage 1 and Stage 2 bore offsets from Figure 10', () => {
    const stage1 = calculateAms2154CylindricalOffset({
      outerRadius: 2.91,
      refractedAngle: PW_REFERENCE_REFRACTED_ANGLE,
      shearVelocity: PW_REFERENCE_SHEAR_VELOCITY,
    });
    const stage2 = calculateAms2154CylindricalOffset({
      outerRadius: 2.773,
      refractedAngle: PW_REFERENCE_REFRACTED_ANGLE,
      shearVelocity: PW_REFERENCE_SHEAR_VELOCITY,
    });

    expect(stage1.offset).toBeCloseTo(0.943, 3);
    expect(stage2.offset).toBeCloseTo(0.898, 3);
  });

  it('feeds the calculated offsets into the shared PW part and scan-plan data', () => {
    expect(PW_V2500_PARTS.hptStage1.boreOffset).toBeCloseTo(0.943, 3);
    expect(PW_V2500_PARTS.hptStage2.boreOffset).toBeCloseTo(0.898, 3);
    expect(PW_V2500_STAGE1_SCAN_PLAN.boreOffset).toBe(PW_V2500_PARTS.hptStage1.boreOffset);
    expect(PW_V2500_STAGE2_SCAN_PLAN.boreOffset).toBe(PW_V2500_PARTS.hptStage2.boreOffset);
    expect(PW_V2500_STAGE1_SCAN_PLAN.waterPath).toBe(PW_HPT_TRANSDUCER_SETUP.waterPath);
    expect(PW_V2500_STAGE2_SCAN_PLAN.waterPath).toBe(PW_HPT_TRANSDUCER_SETUP.waterPath);
  });
});
