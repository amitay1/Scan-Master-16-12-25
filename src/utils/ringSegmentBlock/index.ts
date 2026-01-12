/**
 * Ring Segment Block Module
 *
 * Parametric ring segment calibration block system for angle beam
 * ultrasonic testing of curved parts (tubes, cylinders, rings).
 *
 * Usage:
 * ```typescript
 * import { resolveRingSegmentBlock } from '@/utils/ringSegmentBlock';
 *
 * // Resolve with default template
 * const block = resolveRingSegmentBlock('EN_10228_DAC_REF_BLOCK');
 *
 * // Resolve with part dimensions override
 * const customBlock = resolveRingSegmentBlock('EN_10228_DAC_REF_BLOCK', {
 *   outerDiameterMm: 300,
 *   innerDiameterMm: 200,
 * });
 * ```
 */

// Types
export type {
  BlockShape,
  DepthDefinition,
  AxialOrigin,
  ReflectorType,
  HoleLabel,
  StandardFamily,
  RingSegmentGeometry,
  CalculatedGeometry,
  CurvedHolePosition,
  HoleFeature,
  ResolvedHole,
  RingSegmentBlockTemplate,
  ValidationWarning,
  ValidationCode,
  GeometryValidationResult,
  HoleValidationResult,
  ThinWallPolicy,
  ThinWallPolicyResult,
  ResolvedRingSegmentBlock,
  DrawingViewType,
  DrawingConfig,
  HoleTableRow,
  ExportOptions,
  PartDimensionsOverride,
  PartGeometryClass,
  CurvatureAssessment,
  CalibrationBlockRecommendation,
} from '@/types/ringSegmentBlock.types';

export { DEFAULT_THIN_WALL_POLICY } from '@/types/ringSegmentBlock.types';

// Geometry utilities
export {
  calculateWallThickness,
  calculateMeanRadius,
  calculateArcLength,
  calculateAngleFromArcLength,
  calculateDerivedGeometry,
  degreesToRadians,
  radiansToDegrees,
  polarToCartesian,
  cartesianToPolar,
  calculateHole3DPosition,
  projectToTopView,
  projectToSectionView,
  resolveAxialPosition,
  calculateHoleArcDistance,
  calculateHole3DDistance,
  generateArcPoints,
  generateArcPath,
  generateArcSegmentPath,
  calculateOptimalScale,
  calculateArcBoundingBox,
} from './geometry';

// Templates
export {
  EN_10228_DAC_REF_BLOCK,
  ASTM_E428_FBH_BLOCK,
  TUV_STYLE_REF_BLOCK,
  RING_SEGMENT_TEMPLATES,
  getTemplate,
  getAvailableTemplateIds,
  getTemplatesByStandard,
  TEMPLATE_OPTIONS,
  createCustomTemplate,
  cloneTemplate,
} from './templates';

// Validator
export {
  validateGeometry,
  validateHolePositions,
  applyThinWallPolicy,
  calculateFallbackDepths,
  isThinWall,
  validateBlockConfiguration,
  defaultThinWallPolicy,
} from './validator';

// Resolver (main entry point)
export {
  resolveRingSegmentBlock,
  resolveENBlock,
  resolveASTMBlock,
  resolveTUVBlock,
  getAvailableTemplates,
  validatePartDimensions,
  autoSelectTemplate,
  resolveBlockAuto,
} from './resolver';
