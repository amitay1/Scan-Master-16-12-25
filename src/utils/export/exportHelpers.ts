/**
 * Export Helpers - Utility functions for PDF/Word export
 * All formatting, colors, and helper functions in one place
 */

// ============================================================================
// COLORS - Professional TUV-style blue theme
// ============================================================================
export const COLORS = {
  // Primary colors
  primary: [0, 82, 147] as [number, number, number],       // TUV blue - headers
  primaryDark: [0, 60, 110] as [number, number, number],   // Darker blue - cover page
  secondary: [64, 128, 178] as [number, number, number],   // Medium blue - subheaders
  accent: [0, 122, 194] as [number, number, number],       // Light blue - highlights
  accentGold: [212, 175, 55] as [number, number, number],  // Gold accent - premium styling

  // Background colors
  headerBg: [240, 245, 250] as [number, number, number],   // Light gray-blue
  sectionBg: [245, 247, 250] as [number, number, number],  // Section backgrounds
  rowAlt: [248, 250, 252] as [number, number, number],     // Alternating row
  white: [255, 255, 255] as [number, number, number],

  // Border colors
  tableBorder: [200, 210, 220] as [number, number, number],
  divider: [220, 225, 230] as [number, number, number],

  // Text colors
  text: [30, 30, 30] as [number, number, number],          // Dark text
  lightText: [100, 100, 100] as [number, number, number],  // Secondary text
  mutedText: [130, 130, 130] as [number, number, number],  // Muted/subtle text
  confidential: [180, 50, 50] as [number, number, number], // Confidential notice

  // Status colors
  success: [34, 139, 34] as [number, number, number],      // Green - Accept
  warning: [255, 165, 0] as [number, number, number],      // Orange - warnings
  error: [220, 53, 69] as [number, number, number],        // Red - Reject
};

// ============================================================================
// PAGE SETTINGS
// ============================================================================
export const PAGE = {
  width: 210,           // A4 width in mm
  height: 297,          // A4 height in mm
  marginLeft: 15,
  marginRight: 15,
  marginTop: 20,
  marginBottom: 20,
  headerHeight: 15,
  footerHeight: 10,
  contentWidth: 180,    // 210 - 15 - 15
  contentStart: 35,     // After header
};

// ============================================================================
// FONTS
// ============================================================================
export const FONTS = {
  coverTitle: { size: 26, style: 'bold' as const },        // Main cover page title
  title: { size: 18, style: 'bold' as const },
  sectionTitle: { size: 14, style: 'bold' as const },
  subsectionTitle: { size: 12, style: 'bold' as const },
  tableHeader: { size: 10, style: 'bold' as const },
  body: { size: 10, style: 'normal' as const },
  small: { size: 9, style: 'normal' as const },
  tiny: { size: 8, style: 'normal' as const },
};

// ============================================================================
// VISUAL SETTINGS
// ============================================================================
export const VISUAL = {
  radiusSmall: 1,
  radiusMedium: 2,
  radiusLarge: 3,
  shadowOffset: 0.5,
};

// ============================================================================
// FORMAT HELPERS
// ============================================================================

/**
 * Format a value for display - returns "-" if empty/undefined
 */
export function formatValue(value: string | number | undefined | null, suffix?: string): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const str = String(value);
  return suffix ? `${str} ${suffix}` : str;
}

/**
 * Format a number with units
 */
export function formatNumber(value: number | undefined | null, decimals = 2, unit?: string): string {
  if (value === undefined || value === null) {
    return '-';
  }
  const formatted = Number(value).toFixed(decimals);
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Format a date string
 */
export function formatDate(date: string | undefined | null): string {
  if (!date) return '-';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return date;
  }
}

/**
 * Format part type for display (convert snake_case to Title Case)
 */
export function formatPartType(partType: string | undefined): string {
  if (!partType) return '-';
  return partType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format material type for display
 */
export function formatMaterial(material: string | undefined, customName?: string): string {
  if (!material) return '-';
  if (material === 'custom' && customName) {
    return customName;
  }
  return material
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format calibration block type
 */
export function formatBlockType(type: string | undefined): string {
  if (!type) return '-';
  const typeMap: Record<string, string> = {
    'flat_block': 'Flat Block',
    'curved_block': 'Curved Block',
    'cylinder_notched': 'Cylinder (Notched)',
    'cylinder_fbh': 'Cylinder (FBH)',
    'solid_cylinder_fbh': 'Solid Cylinder (FBH)',
    'angle_beam': 'Angle Beam Block',
    'iiv_block': 'IIW Block',
    'step_wedge': 'Step Wedge',
    'iow_block': 'IOW Block',
    'custom': 'Custom Block',
  };
  return typeMap[type] || formatPartType(type);
}

/**
 * Format scan method
 */
export function formatScanMethod(method: string | undefined): string {
  if (!method) return '-';
  const methodMap: Record<string, string> = {
    'immersion': 'Immersion',
    'contact': 'Contact',
    'squirter': 'Squirter / Water Jet',
  };
  return methodMap[method.toLowerCase()] || method;
}

/**
 * Format transducer type
 */
export function formatTransducerType(type: string | undefined): string {
  if (!type) return '-';
  const typeMap: Record<string, string> = {
    'immersion': 'Immersion',
    'contact': 'Contact',
    'dual_element': 'Dual Element',
  };
  return typeMap[type.toLowerCase()] || type;
}

/**
 * Format acceptance class with description
 */
export function formatAcceptanceClass(cls: string | undefined): { class: string; description: string } {
  if (!cls) return { class: '-', description: 'Not specified' };

  const classMap: Record<string, string> = {
    'AAA': 'Most Stringent - Critical Flight Components',
    'AA': 'Very Stringent - Primary Structure',
    'A': 'Stringent - Secondary Structure',
    'B': 'Standard - General Aerospace',
    'C': 'Least Stringent - Non-Critical Parts',
  };

  return {
    class: cls,
    description: classMap[cls] || 'Custom acceptance criteria',
  };
}

/**
 * Check if part type is cylindrical (needs diameter display)
 */
export function isCylindrical(partType: string | undefined): boolean {
  if (!partType) return false;
  const cylindricalTypes = [
    'tube', 'pipe', 'ring', 'ring_forging', 'sleeve', 'bushing',
    'cylinder', 'round_bar', 'shaft', 'disk', 'disk_forging',
    'round_forging_stock', 'sphere', 'cone', 'hexagon'
  ];
  return cylindricalTypes.includes(partType);
}

/**
 * Check if part type is a cone (needs cone dimensions)
 */
export function isCone(partType: string | undefined): boolean {
  return partType === 'cone';
}

/**
 * Get part dimensions as formatted rows based on part type
 */
export function getPartDimensionRows(setup: {
  partType?: string;
  partThickness?: number;
  partLength?: number;
  partWidth?: number;
  diameter?: number;
  innerDiameter?: number;
  wallThickness?: number;
  isHollow?: boolean;
  coneTopDiameter?: number;
  coneBottomDiameter?: number;
  coneHeight?: number;
}): Array<[string, string]> {
  const rows: Array<[string, string]> = [];

  // Common dimensions
  if (setup.partThickness) {
    rows.push(['Thickness', formatNumber(setup.partThickness, 1, 'mm')]);
  }
  if (setup.partLength) {
    rows.push(['Length', formatNumber(setup.partLength, 1, 'mm')]);
  }
  if (setup.partWidth) {
    rows.push(['Width', formatNumber(setup.partWidth, 1, 'mm')]);
  }

  // Cylindrical dimensions
  if (isCylindrical(setup.partType)) {
    if (setup.diameter) {
      rows.push(['Outer Diameter (OD)', formatNumber(setup.diameter, 1, 'mm')]);
    }
    if (setup.isHollow && setup.innerDiameter) {
      rows.push(['Inner Diameter (ID)', formatNumber(setup.innerDiameter, 1, 'mm')]);
    }
    if (setup.isHollow && setup.wallThickness) {
      rows.push(['Wall Thickness', formatNumber(setup.wallThickness, 2, 'mm')]);
    }
  }

  // Cone dimensions
  if (isCone(setup.partType)) {
    if (setup.coneBottomDiameter) {
      rows.push(['Bottom Diameter', formatNumber(setup.coneBottomDiameter, 1, 'mm')]);
    }
    if (setup.coneTopDiameter !== undefined) {
      rows.push(['Top Diameter', setup.coneTopDiameter === 0 ? 'Pointed (0)' : formatNumber(setup.coneTopDiameter, 1, 'mm')]);
    }
    if (setup.coneHeight) {
      rows.push(['Cone Height', formatNumber(setup.coneHeight, 1, 'mm')]);
    }
  }

  // Hollow indicator
  if (setup.isHollow !== undefined) {
    rows.push(['Hollow Part', setup.isHollow ? 'Yes' : 'No']);
  }

  return rows;
}

/**
 * Get material warning if applicable
 */
export function getMaterialWarning(material: string | undefined): string | null {
  if (!material) return null;

  const warnings: Record<string, string> = {
    'titanium': 'CAUTION: Titanium requires special attention to grain structure and anisotropy. Additional angle beam inspection may be required.',
    'magnesium': 'CAUTION: Magnesium alloys may exhibit high attenuation. Adjust gain and sensitivity accordingly.',
  };

  return warnings[material.toLowerCase()] || null;
}

/**
 * Build table data from key-value pairs, filtering out empty values
 */
export function buildTableRows(
  data: Array<[string, string | number | undefined | null]>,
  options: { showEmpty?: boolean; emptyText?: string } = {}
): Array<[string, string]> {
  const { showEmpty = false, emptyText = '-' } = options;

  return data
    .filter(([, value]) => showEmpty || (value !== undefined && value !== null && value !== ''))
    .map(([label, value]) => [
      label,
      value === undefined || value === null || value === ''
        ? emptyText
        : String(value)
    ]);
}
