import { describe, expect, it } from 'vitest';
import {
  ASTM_E428_FBH_BLOCK,
  EN_10228_DAC_REF_BLOCK,
  TUV_STYLE_REF_BLOCK,
  autoSelectTemplate,
  calculateWallThickness,
  resolveRingSegmentBlock,
} from '@/utils/ringSegmentBlock';

const TEMPLATE_EXPECTATIONS = {
  EN_10228_DAC_REF_BLOCK: {
    template: EN_10228_DAC_REF_BLOCK,
    geometry: { outerDiameterMm: 400, innerDiameterMm: 250, axialWidthMm: 125, segmentAngleDeg: 120 },
    holeLabels: ['A', 'B', 'C', 'D'],
    angles: [15, 45, 75, 105],
    axials: [25, 50, 75, 100],
    depths: [15, 35, 55, 70],
    depthDefinition: 'radial_depth',
  },
  ASTM_E428_FBH_BLOCK: {
    template: ASTM_E428_FBH_BLOCK,
    geometry: { outerDiameterMm: 300, innerDiameterMm: 200, axialWidthMm: 100, segmentAngleDeg: 90 },
    holeLabels: ['A', 'B', 'C'],
    angles: [22.5, 45, 67.5],
    axials: [25, 50, 75],
    depths: [12.7, 25.4, 38.1],
    depthDefinition: 'along_drill_axis',
  },
  TUV_STYLE_REF_BLOCK: {
    template: TUV_STYLE_REF_BLOCK,
    geometry: { outerDiameterMm: 671.02, innerDiameterMm: 476.2, axialWidthMm: 125, segmentAngleDeg: 120 },
    holeLabels: ['A', 'B', 'C', 'D'],
    angles: [15, 45, 75, 105],
    axials: [25, 50, 75, 100],
    depths: [29.0, 63.5, 70.1, 92.38],
    depthDefinition: 'radial_depth',
  },
} as const;

describe('ring-segment reference templates', () => {
  it('preserves the expected reference geometry and hole metadata for EN, ASTM, and TUV', () => {
    for (const [templateId, expected] of Object.entries(TEMPLATE_EXPECTATIONS)) {
      const resolved = resolveRingSegmentBlock(templateId);
      const template = expected.template;

      expect(template.geometry.outerDiameterMm).toBeCloseTo(expected.geometry.outerDiameterMm, 6);
      expect(template.geometry.innerDiameterMm).toBeCloseTo(expected.geometry.innerDiameterMm, 6);
      expect(template.geometry.axialWidthMm).toBeCloseTo(expected.geometry.axialWidthMm, 6);
      expect(template.geometry.segmentAngleDeg).toBeCloseTo(expected.geometry.segmentAngleDeg, 6);

      expect(resolved.holes.map((hole) => hole.label)).toEqual(expected.holeLabels);
      expect(resolved.holes.map((hole) => hole.angleOnArcDeg)).toEqual(expected.angles);
      expect(resolved.holes.map((hole) => hole.axialPositionMm)).toEqual(expected.axials);
      expect(resolved.holes.map((hole) => hole.depthMm)).toEqual(expected.depths);
      expect(new Set(resolved.holes.map((hole) => hole.depthDefinition))).toEqual(
        new Set([expected.depthDefinition])
      );
      expect(resolved.isCompliant).toBe(true);
    }
  });

  it('stores physically consistent top-view and section-view coordinates for the resolved holes', () => {
    const resolved = resolveRingSegmentBlock('TUV_STYLE_REF_BLOCK');
    const outerRadius = resolved.geometry.outerDiameterMm / 2;
    const wallThickness = calculateWallThickness(
      resolved.geometry.outerDiameterMm,
      resolved.geometry.innerDiameterMm
    );

    for (const hole of resolved.holes) {
      const radialDistance = Math.hypot(hole.cartesian.x, hole.cartesian.z);

      expect(radialDistance).toBeCloseTo(outerRadius - hole.depthMm, 6);
      expect(hole.topViewPosition.x).toBeCloseTo(hole.cartesian.z, 6);
      expect(hole.topViewPosition.y).toBeCloseTo(-hole.cartesian.x, 6);
      expect(hole.sectionViewPosition.x).toBeCloseTo(wallThickness - hole.depthMm, 6);
      expect(hole.sectionViewPosition.y).toBeCloseTo(hole.axialPositionMm, 6);
    }
  });
});

describe('ring-segment scaling behavior', () => {
  it('preserves normalized angle, axial, and depth ratios when adapting the EN block to a new part', () => {
    const override = {
      outerDiameterMm: 540,
      innerDiameterMm: 330,
      axialWidthMm: 180,
      segmentAngleDeg: 150,
    };

    const resolved = resolveRingSegmentBlock('EN_10228_DAC_REF_BLOCK', override);
    const referenceWall = calculateWallThickness(
      EN_10228_DAC_REF_BLOCK.geometry.outerDiameterMm,
      EN_10228_DAC_REF_BLOCK.geometry.innerDiameterMm
    );
    const targetWall = calculateWallThickness(
      override.outerDiameterMm,
      override.innerDiameterMm
    );

    resolved.holes.forEach((hole, index) => {
      const referencePosition = EN_10228_DAC_REF_BLOCK.holePositions[index];
      const referenceFeature = EN_10228_DAC_REF_BLOCK.holeFeatures[index];
      const radialDistance = Math.hypot(hole.cartesian.x, hole.cartesian.z);

      expect(hole.angleOnArcDeg / resolved.geometry.segmentAngleDeg).toBeCloseTo(
        referencePosition.angleOnArcDeg / EN_10228_DAC_REF_BLOCK.geometry.segmentAngleDeg,
        6
      );
      expect(hole.axialPositionMm / resolved.geometry.axialWidthMm).toBeCloseTo(
        referencePosition.axialPositionMm / EN_10228_DAC_REF_BLOCK.geometry.axialWidthMm,
        6
      );
      expect(hole.depthMm / targetWall).toBeCloseTo(referenceFeature.depthMm / referenceWall, 6);
      expect(radialDistance).toBeCloseTo(resolved.geometry.outerDiameterMm / 2 - hole.depthMm, 6);
    });
  });

  it('keeps ASTM FBH hole depths tied to the OD-normal drill axis metadata', () => {
    const resolved = resolveRingSegmentBlock('ASTM_E428_FBH_BLOCK');
    const outerRadius = resolved.geometry.outerDiameterMm / 2;

    for (const hole of resolved.holes) {
      expect(hole.depthDefinition).toBe('along_drill_axis');
      expect(Math.hypot(hole.cartesian.x, hole.cartesian.z)).toBeCloseTo(outerRadius - hole.depthMm, 6);
    }
  });
});

describe('ring-segment template auto-selection', () => {
  it('uses TUV for large diameters and includes wall thickness in the reasoning when OD and ID are known', () => {
    const result = autoSelectTemplate({
      outerDiameterMm: 671.02,
      innerDiameterMm: 476.2,
      axialWidthMm: 125,
    });

    expect(result.templateId).toBe('TUV_STYLE_REF_BLOCK');
    expect(result.reasoning).toContain('wall 97.4mm');
  });

  it('uses ASTM when the standard preference requests it', () => {
    const result = autoSelectTemplate(
      {
        outerDiameterMm: 300,
        innerDiameterMm: 200,
        axialWidthMm: 100,
      },
      'ASTM'
    );

    expect(result.templateId).toBe('ASTM_E428_FBH_BLOCK');
    expect(result.reasoning).toContain('wall 50.0mm');
  });
});
