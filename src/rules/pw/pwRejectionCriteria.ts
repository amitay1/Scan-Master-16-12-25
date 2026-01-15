/**
 * Pratt & Whitney Rejection Criteria
 *
 * Source: NDIP-1226 Section 8.0 (Rev F)
 * Source: NDIP-1227 Section 8.0 (Rev D)
 *
 * CRITICAL: Any HPT disk exhibiting a rejectable ultrasonic indication(s)
 * must be removed from service and returned to Pratt & Whitney.
 */

/**
 * Amplitude C-Scan Rejection Criteria
 * Per NDIP Section 8.1.2
 */
export interface AmplitudeCriteria {
  minPixelGrouping: number; // Minimum pixel cluster size
  adjacentPixelDepthTolerance: number; // inches - depth tolerance between pixels
  calibrationAmplitude: number; // %FSH - FBH#1 set level
  rejectThreshold: number; // %FSH - rejection level
  evaluationThreshold: number; // %FSH - evaluation level
}

export const PW_AMPLITUDE_CRITERIA: AmplitudeCriteria = {
  minPixelGrouping: 3, // Section 8.1.2.1 - minimum 3 pixel grouping
  adjacentPixelDepthTolerance: 0.025, // inches (Section 8.1.2.1)
  calibrationAmplitude: 80, // %FSH - FBH#1 set to 80%FSH
  rejectThreshold: 20, // %FSH - Reject at 20%FSH (25% of 80%)
  evaluationThreshold: 15, // %FSH - Evaluation at 15%FSH
};

/**
 * Time of Flight (TOF) C-Scan Rejection Criteria
 * Per NDIP Section 8.1.3
 */
export interface TOFCriteria {
  minPixelGrouping: number; // Minimum pixel cluster size
  minAdjacentScanLines: number; // Minimum adjacent scan lines
  adjacentScanPixelDepth: number; // inches
  adjacentIndexPixelDepth: number; // inches
  snrThreshold: number; // Signal-to-Noise Ratio threshold
  lowNoiseThreshold: number; // %FSH - threshold for low-noise C-Scans
  lowNoiseRejectionLevel: number; // %FSH - rejection level for low-noise scans
}

export const PW_TOF_CRITERIA: TOFCriteria = {
  minPixelGrouping: 15, // Section 8.1.3.1.1
  minAdjacentScanLines: 3, // Section 8.1.3.1.5
  adjacentScanPixelDepth: 0.025, // inches (Section 8.1.3.1.3)
  adjacentIndexPixelDepth: 0.01, // inches (Section 8.1.3.1.4)
  snrThreshold: 1.5, // SNR ≥ 1.5:1 (Section 8.1.3.3)
  lowNoiseThreshold: 5.0, // %FSH (Section 8.1.3.3.2)
  lowNoiseRejectionLevel: 7.5, // %FSH (Section 8.1.3.3.2)
};

/**
 * Pixel grouping patterns considered valid (3-pixel minimum)
 * From Figure 3 in NDIP
 */
export type PixelPattern = '2over1' | '1over2' | 'L-shape' | 'diagonal-excluded';

export const VALID_PIXEL_PATTERNS: PixelPattern[] = [
  '2over1', // 2 pixels on top, 1 below
  '1over2', // 1 pixel on top, 2 below
  'L-shape', // L-shaped 3 pixel cluster
];

/**
 * Interface signal evaluation criteria
 * Per NDIP Section 8.1.4
 */
export interface InterfaceSignalEvaluation {
  condition: 'widening' | 'moving' | 'stationary';
  likelyCause: string;
  action: string;
}

export const INTERFACE_SIGNAL_EVALUATIONS: InterfaceSignalEvaluation[] = [
  {
    condition: 'widening',
    likelyCause: 'Surface roughness',
    action:
      'Move gate start outside of interface signal and re-scan the location',
  },
  {
    condition: 'moving',
    likelyCause: 'Run-out',
    action: 'Adjust water path to local area and re-scan the location',
  },
  {
    condition: 'stationary',
    likelyCause: 'Water path deviation',
    action: 'Adjust transducer to intended water path and re-scan the location',
  },
];

/**
 * Water contamination/debris ("Floaters") evaluation
 * Per NDIP Section 8.1.5
 */
export const FLOATER_CRITERIA = {
  characteristic: 'Single scan line pixel clusters',
  action: 'Subject to local re-scan to confirm repeatability',
  rejectIfRepeatable: true,
};

/**
 * Indication evaluation result
 */
export interface IndicationEvaluation {
  indicationType: 'amplitude' | 'tof' | 'interface' | 'floater';
  isRejectable: boolean;
  reason: string;
  pixelCount?: number;
  amplitude?: number;
  snr?: number;
  location?: {
    indexLocation: number; // inches
    depthAlongSoundPath: number; // inches
    circumferentialLocation: number; // degrees
  };
}

/**
 * Evaluate amplitude C-scan indication
 * Per NDIP Section 8.1.2
 */
export function evaluateAmplitudeIndication(
  pixelClusterSize: number,
  maxAmplitude: number, // %FSH
  adjacentPixelDepthsWithinTolerance: boolean,
  criteria: AmplitudeCriteria = PW_AMPLITUDE_CRITERIA
): IndicationEvaluation {
  // Check minimum pixel grouping
  if (pixelClusterSize < criteria.minPixelGrouping) {
    return {
      indicationType: 'amplitude',
      isRejectable: false,
      reason: `Pixel cluster size (${pixelClusterSize}) below minimum (${criteria.minPixelGrouping}) - non-relevant`,
      pixelCount: pixelClusterSize,
      amplitude: maxAmplitude,
    };
  }

  // Check depth tolerance
  if (!adjacentPixelDepthsWithinTolerance) {
    return {
      indicationType: 'amplitude',
      isRejectable: false,
      reason: `Adjacent pixel depths exceed ${criteria.adjacentPixelDepthTolerance}" tolerance - disregarded`,
      pixelCount: pixelClusterSize,
      amplitude: maxAmplitude,
    };
  }

  // Check amplitude threshold
  if (maxAmplitude >= criteria.rejectThreshold) {
    return {
      indicationType: 'amplitude',
      isRejectable: true,
      reason: `Max amplitude (${maxAmplitude}%FSH) exceeds reject threshold (${criteria.rejectThreshold}%FSH) - REJECTABLE`,
      pixelCount: pixelClusterSize,
      amplitude: maxAmplitude,
    };
  }

  // Evaluation level
  if (maxAmplitude >= criteria.evaluationThreshold) {
    return {
      indicationType: 'amplitude',
      isRejectable: false,
      reason: `Max amplitude (${maxAmplitude}%FSH) at evaluation level - requires further analysis`,
      pixelCount: pixelClusterSize,
      amplitude: maxAmplitude,
    };
  }

  return {
    indicationType: 'amplitude',
    isRejectable: false,
    reason: `Max amplitude (${maxAmplitude}%FSH) below evaluation threshold - acceptable`,
    pixelCount: pixelClusterSize,
    amplitude: maxAmplitude,
  };
}

/**
 * Evaluate TOF C-scan indication
 * Per NDIP Section 8.1.3
 */
export function evaluateTOFIndication(
  pixelClusterSize: number,
  adjacentScanLines: number,
  peakAmplitude: number, // %FSH
  averageNoise: number, // %FSH
  depthsWithinScanTolerance: boolean,
  depthsWithinIndexTolerance: boolean,
  pixelsShareEdges: boolean,
  criteria: TOFCriteria = PW_TOF_CRITERIA
): IndicationEvaluation {
  // Check minimum pixel grouping
  if (pixelClusterSize < criteria.minPixelGrouping) {
    return {
      indicationType: 'tof',
      isRejectable: false,
      reason: `TOF pixel cluster size (${pixelClusterSize}) below minimum (${criteria.minPixelGrouping}) - non-relevant`,
      pixelCount: pixelClusterSize,
    };
  }

  // Check adjacent scan lines
  if (adjacentScanLines < criteria.minAdjacentScanLines) {
    return {
      indicationType: 'tof',
      isRejectable: false,
      reason: `Adjacent scan lines (${adjacentScanLines}) below minimum (${criteria.minAdjacentScanLines}) - non-relevant`,
      pixelCount: pixelClusterSize,
    };
  }

  // Check pixel edge sharing (diagonal-only excluded)
  if (!pixelsShareEdges) {
    return {
      indicationType: 'tof',
      isRejectable: false,
      reason: 'Pixels oriented diagonally only - excluded per Section 8.1.3.1.2',
      pixelCount: pixelClusterSize,
    };
  }

  // Check depth tolerances
  if (!depthsWithinScanTolerance) {
    return {
      indicationType: 'tof',
      isRejectable: false,
      reason: `Adjacent scan pixel depths exceed ${criteria.adjacentScanPixelDepth}" tolerance`,
      pixelCount: pixelClusterSize,
    };
  }

  if (!depthsWithinIndexTolerance) {
    return {
      indicationType: 'tof',
      isRejectable: false,
      reason: `Adjacent index pixel depths exceed ${criteria.adjacentIndexPixelDepth}" tolerance`,
      pixelCount: pixelClusterSize,
    };
  }

  // Calculate SNR
  // Special case: when average noise < 5%FSH, use 7.5%FSH as rejection level
  let effectiveNoiseLevel = averageNoise;
  if (averageNoise < criteria.lowNoiseThreshold) {
    effectiveNoiseLevel = criteria.lowNoiseThreshold;
  }

  const snr = peakAmplitude / effectiveNoiseLevel;

  if (snr >= criteria.snrThreshold) {
    return {
      indicationType: 'tof',
      isRejectable: true,
      reason: `SNR (${snr.toFixed(2)}:1) exceeds threshold (${criteria.snrThreshold}:1) - REJECTABLE`,
      pixelCount: pixelClusterSize,
      snr,
      amplitude: peakAmplitude,
    };
  }

  return {
    indicationType: 'tof',
    isRejectable: false,
    reason: `SNR (${snr.toFixed(2)}:1) below threshold - acceptable`,
    pixelCount: pixelClusterSize,
    snr,
    amplitude: peakAmplitude,
  };
}

/**
 * Complete rejection criteria summary
 */
export const PW_REJECTION_SUMMARY = {
  amplitudeCriteria: {
    pixelRequirement: '≥3 pixel grouping (2x1 or 1x2 minimum)',
    depthTolerance: 'Adjacent pixels within 0.025" depth',
    calibration: 'FBH#1 at 80%FSH',
    rejectAt: '≥20%FSH (25% of calibration)',
    evaluateAt: '≥15%FSH',
  },
  tofCriteria: {
    pixelRequirement: '≥15 pixels connected along edges',
    scanLineRequirement: '≥3 adjacent scan lines',
    scanDepthTolerance: 'Within 0.025" along beam axis',
    indexDepthTolerance: 'Within 0.010" along beam axis',
    snrRequirement: '≥1.5:1 from mean average noise',
    lowNoiseRule: 'If avg noise <5%FSH, use 7.5%FSH rejection level',
  },
  supplementalEvaluations: [
    'Interface signal encroachment evaluation',
    'Water contamination/debris ("Floaters") re-scan',
  ],
  disposition: 'Rejectable disks must be returned to Pratt & Whitney',
};
