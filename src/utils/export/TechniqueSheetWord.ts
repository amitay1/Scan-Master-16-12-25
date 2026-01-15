/**
 * TechniqueSheetWord - Professional Word Export for Technique Sheets
 *
 * Creates professional DOCX documents using the docx library.
 * SYNCHRONIZED WITH TechniqueSheetPDF.ts - Both exports must have identical content.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  ShadingType,
  PageBreak,
  ImageRun,
} from 'docx';
import { saveAs } from 'file-saver';
import type {
  StandardType,
  InspectionSetupData,
  EquipmentData,
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  DocumentationData,
  ScanPlanData,
} from '@/types/techniqueSheet';
import type { ScanDetailsData } from '@/types/scanDetails';
import {
  formatValue as formatValueHelper,
  formatNumber,
  formatDate as formatDateHelper,
  formatPartType,
  formatMaterial,
  formatBlockType,
  formatScanMethod,
  formatTransducerType,
  formatAcceptanceClass,
  getPartDimensionRows,
  getMaterialWarning,
} from './exportHelpers';

// ============================================================================
// TYPES
// ============================================================================
export interface TechniqueSheetWordExportData {
  standard: StandardType;
  inspectionSetup: InspectionSetupData;
  equipment: EquipmentData;
  calibration: CalibrationData;
  scanParameters: ScanParametersData;
  acceptanceCriteria: AcceptanceCriteriaData;
  documentation: DocumentationData;
  scanDetails?: ScanDetailsData;
  scanPlan?: ScanPlanData;
  capturedDrawing?: string;
  calibrationBlockDiagram?: string;
  angleBeamDiagram?: string;
  e2375Diagram?: string;
  scanDirectionsDrawing?: string;
}

export interface WordExportOptions {
  companyName?: string;
  companyLogo?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const formatValue = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
};

const formatDate = (date: string | Date | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Format technique type for display (matching PDF)
const formatTechnique = (technique?: string): string => {
  if (!technique) return '-';
  const techniqueMap: Record<string, string> = {
    'conventional': 'Conventional',
    'bubbler': 'Bubbler',
    'squirt': 'Squirt / Water Jet',
    'phased_array': 'Phased Array',
  };
  return techniqueMap[technique] || technique;
};

// Convert base64 image to array buffer for Word document
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const createTableRow = (cells: string[], isHeader = false): TableRow => {
  return new TableRow({
    children: cells.map((cell, index) => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({
          text: cell,
          bold: isHeader || index === 0,
          size: isHeader ? 22 : 20,
        })],
        alignment: AlignmentType.LEFT,
      })],
      shading: isHeader ? {
        fill: '1e3a5f',
        type: ShadingType.SOLID,
        color: 'FFFFFF',
      } : undefined,
      width: { size: index === 0 ? 30 : 70, type: WidthType.PERCENTAGE },
    })),
  });
};

const createSection = (title: string, rows: [string, string][]): (Paragraph | Table)[] => {
  const elements: (Paragraph | Table)[] = [];

  elements.push(new Paragraph({
    children: [new TextRun({ text: title, bold: true, size: 26 })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 400, after: 200 },
  }));

  if (rows.length > 0) {
    elements.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows.map(([label, value]) => createTableRow([label, value])),
    }));
  }

  return elements;
};

const createSubsection = (title: string, rows: [string, string][]): (Paragraph | Table)[] => {
  const elements: (Paragraph | Table)[] = [];

  elements.push(new Paragraph({
    children: [new TextRun({ text: title, bold: true, size: 22, color: '374151' })],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
  }));

  if (rows.length > 0) {
    elements.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows.map(([label, value]) => createTableRow([label, value])),
    }));
  }

  return elements;
};

// Create a warning/notice paragraph
const createWarningParagraph = (text: string): Paragraph => {
  return new Paragraph({
    children: [new TextRun({
      text: `⚠️ ${text}`,
      size: 20,
      color: '856404',
    })],
    shading: { fill: 'FFF3CD', type: ShadingType.SOLID, color: '856404' },
    spacing: { before: 200, after: 200 },
  });
};

// ============================================================================
// TABLE OF CONTENTS
// ============================================================================
const buildTableOfContents = (): (Paragraph | Table)[] => {
  const elements: (Paragraph | Table)[] = [];

  // Title
  elements.push(new Paragraph({
    children: [new TextRun({ text: 'TABLE OF CONTENTS', bold: true, size: 28 })],
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 400 },
  }));

  // TOC items - simple list without page numbers
  const tocItems: string[] = [
    '1. Part Information',
    '2. Equipment',
    '3. Calibration',
    '   3.1 FBH Reference Diagram',
    '   3.2 Block Configuration',
    '4. Scan Parameters',
    '5. Acceptance Criteria',
    '6. Scan Details',
    '   6.1 Scanning Directions',
    '   6.2 Technical Drawing',
    '7. Documentation',
    '8. Approvals & Signatures',
  ];

  tocItems.forEach(item => {
    const isSubsection = item.startsWith('   ');
    elements.push(new Paragraph({
      children: [new TextRun({
        text: isSubsection ? item.trim() : item,
        size: isSubsection ? 20 : 22,
        bold: !isSubsection,
      })],
      spacing: { before: isSubsection ? 80 : 160, after: isSubsection ? 80 : 160 },
      indent: { left: isSubsection ? 400 : 0 },
    }));
  });

  // Note about page numbers
  elements.push(new Paragraph({
    children: [new TextRun({
      text: 'Note: Page numbers may vary based on content.',
      italics: true,
      size: 18,
      color: '666666',
    })],
    spacing: { before: 300, after: 200 },
    alignment: AlignmentType.CENTER,
  }));

  // Page break after TOC
  elements.push(new Paragraph({
    children: [new PageBreak()],
  }));

  return elements;
};

// ============================================================================
// APPROVALS SECTION
// ============================================================================
interface ExtendedDocumentationData extends DocumentationData {
  levelIIIName?: string;
  levelIIIDate?: string;
}

const buildApprovalsSection = (documentation: ExtendedDocumentationData, approvalRequired?: boolean): (Paragraph | Table)[] => {
  const elements: (Paragraph | Table)[] = [];

  // Section title
  elements.push(new Paragraph({
    children: [new TextRun({ text: '8. APPROVALS & SIGNATURES', bold: true, size: 26 })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 400, after: 200 },
  }));

  // Signature table with 4 columns like PDF
  const signatureRows: TableRow[] = [];

  // Header row
  signatureRows.push(new TableRow({
    children: ['Role', 'Name / Signature', 'Date', 'Comments'].map(text => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20, color: 'FFFFFF' })],
        alignment: AlignmentType.CENTER,
      })],
      shading: { fill: '1e3a5f', type: ShadingType.SOLID, color: 'FFFFFF' },
      width: { size: 25, type: WidthType.PERCENTAGE },
    })),
  }));

  // Inspector row
  signatureRows.push(new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'UT Inspector', bold: true, size: 20 })] })],
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: documentation.inspectorName || '', size: 20 })] })],
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: formatDate(documentation.inspectionDate), size: 20 })] })],
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: `Level ${documentation.inspectorLevel || '-'}`, size: 20 })] })],
      }),
    ],
  }));

  // Level III row
  signatureRows.push(new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Level III Approval', bold: true, size: 20 })] })],
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: documentation.levelIIIName || '', size: 20 })] })],
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: formatDate(documentation.levelIIIDate), size: 20 })] })],
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: '', size: 20 })] })],
      }),
    ],
  }));

  // Customer Representative row (if approval required)
  if (approvalRequired) {
    signatureRows.push(new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Customer Representative', bold: true, size: 20 })] })],
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '', size: 20 })] })],
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '', size: 20 })] })],
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '', size: 20 })] })],
        }),
      ],
    }));
  }

  elements.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: signatureRows,
  }));

  // NOTICE message with yellow background (if approval required)
  if (approvalRequired) {
    elements.push(new Paragraph({
      children: [new TextRun({
        text: 'NOTICE: This technique sheet requires Level III approval before use.',
        bold: true,
        size: 20,
        color: '856404',
      })],
      shading: { fill: 'FFF3CD', type: ShadingType.SOLID, color: '856404' },
      spacing: { before: 300, after: 200 },
      alignment: AlignmentType.CENTER,
    }));
  }

  // Document control text
  elements.push(new Paragraph({
    children: [new TextRun({
      text: 'This document is controlled. Unauthorized reproduction or distribution is prohibited.',
      italics: true,
      size: 18,
      color: '666666',
    })],
    spacing: { before: 200, after: 100 },
    alignment: AlignmentType.CENTER,
  }));

  elements.push(new Paragraph({
    children: [new TextRun({
      text: `Document generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} by Scan-Master.`,
      italics: true,
      size: 18,
      color: '666666',
    })],
    spacing: { before: 100, after: 200 },
    alignment: AlignmentType.CENTER,
  }));

  return elements;
};

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================
export async function exportTechniqueSheetWord(
  data: TechniqueSheetWordExportData,
  options: WordExportOptions = {}
): Promise<void> {
  const { inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria, documentation, scanDetails } = data;

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(new Paragraph({
    children: [
      new TextRun({ text: 'ULTRASONIC INSPECTION', bold: true, size: 44 }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
  }));
  children.push(new Paragraph({
    children: [
      new TextRun({ text: 'TECHNIQUE SHEET', bold: true, size: 44 }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }));

  // Company name
  if (options.companyName) {
    children.push(new Paragraph({
      children: [new TextRun({ text: options.companyName, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }));
  }

  // Table of Contents
  children.push(...buildTableOfContents());

  // Part Information (matching PDF structure)
  children.push(...createSection('1. PART INFORMATION', [
    ['Part Number', formatValue(inspectionSetup.partNumber)],
    ['Part Name', formatValue(inspectionSetup.partName)],
    ['Material', formatMaterial(inspectionSetup.material, inspectionSetup.customMaterialName)],
    ['Material Specification', formatValue(inspectionSetup.materialSpec)],
    ['Part Type / Geometry', formatPartType(inspectionSetup.partType)],
    ['Drawing Number', formatValue(inspectionSetup.drawingNumber)],
    ['Heat Treatment', formatValue(inspectionSetup.heatTreatment)],
  ]));

  // Dimensions subsection (matching PDF)
  const dimensionRows = getPartDimensionRows(inspectionSetup);
  if (dimensionRows.length > 0) {
    children.push(...createSubsection('Dimensions', dimensionRows.map(row => [row[0], row[1]] as [string, string])));
  }

  // Material Properties subsection (matching PDF)
  if (inspectionSetup.acousticVelocity || inspectionSetup.materialDensity) {
    const matProps: [string, string][] = [];
    if (inspectionSetup.acousticVelocity) {
      matProps.push(['Acoustic Velocity', formatNumber(inspectionSetup.acousticVelocity, 0, 'm/s')]);
    }
    if (inspectionSetup.materialDensity) {
      matProps.push(['Material Density', formatNumber(inspectionSetup.materialDensity, 0, 'kg/m³')]);
    }
    if (matProps.length > 0) {
      children.push(...createSubsection('Material Properties', matProps));
    }
  }

  // Material Warning (matching PDF)
  const materialWarning = getMaterialWarning(inspectionSetup.material);
  if (materialWarning) {
    children.push(createWarningParagraph(materialWarning));
  }

  // Equipment (matching PDF structure)
  children.push(...createSection('2. EQUIPMENT', [
    ['Manufacturer', formatValue(equipment.manufacturer)],
    ['Model', formatValue(equipment.model)],
    ['Serial Number', formatValue(equipment.serialNumber)],
    ['Software Version', formatValue(equipment.softwareVersion)],
  ]));

  // Transducer subsection (matching PDF)
  children.push(...createSubsection('Transducer', [
    ['Probe Model', formatValue(equipment.probeModel)],
    ['Frequency', equipment.frequency ? `${equipment.frequency} MHz` : '-'],
    ['Type', formatTransducerType(equipment.transducerType)],
    ['Element Diameter', equipment.transducerDiameter ? formatNumber(equipment.transducerDiameter, 3, 'inches') : '-'],
    ['Couplant', formatValue(equipment.couplant)],
  ]));

  // Performance Parameters subsection (matching PDF)
  children.push(...createSubsection('Performance Parameters', [
    ['Vertical Linearity', equipment.verticalLinearity ? `${equipment.verticalLinearity}%` : '-'],
    ['Horizontal Linearity', equipment.horizontalLinearity ? `${equipment.horizontalLinearity}%` : '-'],
    ['Entry Surface Resolution', equipment.entrySurfaceResolution ? formatNumber(equipment.entrySurfaceResolution, 3, 'inches') : '-'],
    ['Back Surface Resolution', equipment.backSurfaceResolution ? formatNumber(equipment.backSurfaceResolution, 3, 'inches') : '-'],
  ]));

  // Phased Array Configuration (if applicable - matching PDF)
  if (equipment.numberOfElements || equipment.elementPitch || equipment.wedgeModel || equipment.wedgeType) {
    const paConfig: [string, string][] = [];
    if (equipment.numberOfElements) paConfig.push(['Number of Elements', String(equipment.numberOfElements)]);
    if (equipment.elementPitch) paConfig.push(['Element Pitch', formatNumber(equipment.elementPitch, 2, 'mm')]);
    if (equipment.wedgeModel) paConfig.push(['Wedge Model', formatValue(equipment.wedgeModel)]);
    if (equipment.wedgeType) paConfig.push(['Wedge Type', formatValue(equipment.wedgeType)]);
    if (equipment.delayLine) paConfig.push(['Delay Line', formatValue(equipment.delayLine)]);
    if (paConfig.length > 0) {
      children.push(...createSubsection('Phased Array Configuration', paConfig));
    }
  }

  // Calibration (matching PDF structure)
  children.push(...createSection('3. CALIBRATION', [
    ['Standard/Block Type', formatBlockType(calibration.standardType)],
    ['Reference Material', formatValue(calibration.referenceMaterial)],
    ['Block Dimensions', formatValue(calibration.blockDimensions)],
    ['Block Serial Number', formatValue(calibration.blockSerialNumber)],
    ['Last Calibration Date', formatDate(calibration.lastCalibrationDate)],
    ['Metal Travel Distance', calibration.metalTravelDistance ? formatNumber(calibration.metalTravelDistance, 1, 'mm') : '-'],
  ]));

  // FBH Table (matching PDF - if fbhHoles array exists)
  if (calibration.fbhHoles && calibration.fbhHoles.length > 0) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Flat Bottom Holes (FBH)', bold: true, size: 22, color: '374151' })],
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 100 },
    }));

    // FBH table header
    const fbhHeaderRow = new TableRow({
      children: ['P/N', 'Δ Type', 'Ø FBH (inch)', 'Ø FBH (mm)', 'B (mm)', 'H (mm)'].map(text => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text, bold: true, size: 18, color: 'FFFFFF' })],
          alignment: AlignmentType.CENTER,
        })],
        shading: { fill: '1e3a5f', type: ShadingType.SOLID, color: 'FFFFFF' },
      })),
    });

    const fbhDataRows = calibration.fbhHoles.map(hole => new TableRow({
      children: [
        hole.partNumber || '-',
        hole.deltaType || '-',
        hole.diameterInch || '-',
        formatNumber(hole.diameterMm, 2, 'mm'),
        formatNumber(hole.distanceB, 1, 'mm'),
        formatNumber(hole.metalTravelH, 1, 'mm'),
      ].map(text => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, size: 18 })] })],
      })),
    }));

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [fbhHeaderRow, ...fbhDataRows],
    }));
  } else if (calibration.fbhSizes) {
    // Legacy FBH sizes string
    children.push(...createSubsection('FBH Sizes', [['FBH Sizes', formatValue(calibration.fbhSizes)]]));
  }

  // Scan Parameters (matching PDF structure)
  children.push(...createSection('4. SCAN PARAMETERS', [
    ['Scan Method', formatScanMethod(scanParameters.scanMethod)],
    ['Technique', formatTechnique(scanParameters.technique)],
    ['Scan Type', formatValue(scanParameters.scanType)],
    ['Scan Pattern', formatValue(scanParameters.scanPattern)],
    ['Coupling Method', formatValue(scanParameters.couplingMethod)],
  ]));

  // Speed & Coverage subsection (matching PDF)
  children.push(...createSubsection('Speed & Coverage', [
    ['Scan Speed', scanParameters.scanSpeed ? formatNumber(scanParameters.scanSpeed, 0, 'mm/s') : '-'],
    ['Scan Index', scanParameters.scanIndex ? formatNumber(scanParameters.scanIndex, 0, '%') : '-'],
    ['Coverage', scanParameters.coverage ? `${scanParameters.coverage}%` : '-'],
    ['Water Path', scanParameters.waterPath ? formatNumber(scanParameters.waterPath, 1, 'mm') : '-'],
  ]));

  // Instrument Settings subsection (matching PDF)
  children.push(...createSubsection('Instrument Settings', [
    ['Pulse Repetition Rate (PRF)', scanParameters.pulseRepetitionRate ? `${scanParameters.pulseRepetitionRate} Hz` : '-'],
    ['Gain Settings', formatValue(scanParameters.gainSettings)],
    ['Alarm Gate Settings', formatValue(scanParameters.alarmGateSettings)],
  ]));

  // Phased Array Settings (if applicable - matching PDF)
  if (scanParameters.couplingMethod === 'phased_array' && scanParameters.phasedArray) {
    const pa = scanParameters.phasedArray;
    const paSettings: [string, string][] = [];
    if (pa.refractedAngleStart) paSettings.push(['Refracted Angle Start', `${pa.refractedAngleStart}°`]);
    if (pa.refractedAngleEnd) paSettings.push(['Refracted Angle End', `${pa.refractedAngleEnd}°`]);
    if (pa.aperture) paSettings.push(['Aperture', String(pa.aperture)]);
    if (pa.focusLaws) paSettings.push(['Focus Laws', formatValue(pa.focusLaws)]);
    if (paSettings.length > 0) {
      children.push(...createSubsection('Phased Array Settings', paSettings));
    }
  }

  // Acceptance Criteria (matching PDF structure)
  const classInfo = formatAcceptanceClass(acceptanceCriteria.acceptanceClass);

  // Add Acceptance Class badge/highlight
  if (classInfo.class !== '-') {
    children.push(new Paragraph({
      children: [
        new TextRun({ text: '5. ACCEPTANCE CRITERIA', bold: true, size: 26 }),
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    }));

    children.push(new Paragraph({
      children: [
        new TextRun({ text: 'ACCEPTANCE CLASS: ', bold: true, size: 24 }),
        new TextRun({ text: classInfo.class, bold: true, size: 28, color: '1e3a5f' }),
        new TextRun({ text: ` (${classInfo.description})`, size: 20, color: '6b7280' }),
      ],
      spacing: { before: 100, after: 200 },
    }));
  } else {
    children.push(...createSection('5. ACCEPTANCE CRITERIA', []));
  }

  // Criteria Table (matching PDF)
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      ['Single Discontinuity', formatValue(acceptanceCriteria.singleDiscontinuity)],
      ['Multiple Discontinuities', formatValue(acceptanceCriteria.multipleDiscontinuities)],
      ['Linear Discontinuity', formatValue(acceptanceCriteria.linearDiscontinuity)],
      ['Back Reflection Loss', acceptanceCriteria.backReflectionLoss ? `${acceptanceCriteria.backReflectionLoss}%` : '-'],
      ['Noise Level', formatValue(acceptanceCriteria.noiseLevel)],
    ].map(([label, value]) => createTableRow([label, value])),
  }));

  // Special Requirements (matching PDF)
  if (acceptanceCriteria.specialRequirements) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Special Requirements', bold: true, size: 22, color: '374151' })],
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 100 },
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: acceptanceCriteria.specialRequirements, size: 20 })],
      spacing: { before: 100, after: 200 },
    }));
  }

  // Material Warning in Acceptance section (matching PDF)
  if (materialWarning) {
    children.push(createWarningParagraph(`MATERIAL WARNING: ${materialWarning}`));
  }

  // Scan Details (if available - matching PDF structure with multiple tables)
  if (scanDetails?.scanDetails && scanDetails.scanDetails.some(d => d.enabled)) {
    children.push(new Paragraph({
      children: [new TextRun({ text: '6. SCAN DETAILS & DIRECTIONS', bold: true, size: 26 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    }));

    const enabledDetails = scanDetails.scanDetails.filter(d => d.enabled);

    // Table 1: Scan Directions Overview (matching PDF)
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Scan Directions Overview', bold: true, size: 22, color: '374151' })],
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 100 },
    }));

    const overviewHeaderRow = new TableRow({
      children: ['Dir.', 'Wave Mode', 'Angle', 'Freq.', 'Make', 'Probe/Size', 'Remarks'].map(text => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 16, color: 'FFFFFF' })] })],
        shading: { fill: '1e3a5f', type: ShadingType.SOLID, color: 'FFFFFF' },
      })),
    });

    const overviewDataRows = enabledDetails.map(detail => new TableRow({
      children: [
        detail.scanningDirection,
        detail.waveMode || '-',
        detail.angle !== undefined ? `${detail.angle}°` : '-',
        detail.frequency ? `${detail.frequency} MHz` : '-',
        detail.make || '-',
        detail.probe || '-',
        detail.remarkDetails || '-',
      ].map(text => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, size: 16 })] })],
      })),
    }));

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [overviewHeaderRow, ...overviewDataRows],
    }));

    // Table 2: Probe Details (matching PDF)
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Probe Details', bold: true, size: 22, color: '374151' })],
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 300, after: 100 },
    }));

    const probeHeaderRow = new TableRow({
      children: ['Dir.', 'Part Number', 'Serial Number', 'Range', 'Attenuation', 'BWE', 'SSS'].map(text => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 16, color: 'FFFFFF' })] })],
        shading: { fill: '2563eb', type: ShadingType.SOLID, color: 'FFFFFF' },
      })),
    });

    const probeDataRows = enabledDetails.map(detail => new TableRow({
      children: [
        detail.scanningDirection,
        detail.partNumber || '-',
        detail.serialNumber || '-',
        detail.rangeMm !== undefined ? `${detail.rangeMm} mm` : '-',
        detail.attenuation !== undefined ? `${detail.attenuation} dB` : '-',
        detail.backWallEcho !== undefined ? `${detail.backWallEcho}%` : '-',
        detail.sss || '-',
      ].map(text => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, size: 16 })] })],
      })),
    }));

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [probeHeaderRow, ...probeDataRows],
    }));

    // Table 3: Gate Settings (matching PDF)
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Gate Settings', bold: true, size: 22, color: '374151' })],
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 300, after: 100 },
    }));

    const formatGate = (gate?: { start: number; length: number; level: number }): string => {
      if (!gate) return '-';
      return `${gate.start}-${gate.length}-${gate.level}%`;
    };

    const gateHeaderRow = new TableRow({
      children: ['Dir.', 'Gate 1 (Start-Length-Level)', 'Gate 2 (Start-Length-Level)'].map(text => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 16, color: 'FFFFFF' })] })],
        shading: { fill: '10b981', type: ShadingType.SOLID, color: 'FFFFFF' },
      })),
    });

    const gateDataRows = enabledDetails.map(detail => {
      const extDetail = detail as typeof detail & {
        gate1?: { start: number; length: number; level: number };
        gate2?: { start: number; length: number; level: number };
      };
      return new TableRow({
        children: [
          detail.scanningDirection,
          formatGate(extDetail.gate1),
          formatGate(extDetail.gate2),
        ].map(text => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, size: 16 })] })],
        })),
      });
    });

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [gateHeaderRow, ...gateDataRows],
    }));

    // Table 4: Pulsar Parameters (matching PDF)
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Pulsar Parameters', bold: true, size: 22, color: '374151' })],
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 300, after: 100 },
    }));

    const pulsarHeaderRow = new TableRow({
      children: ['Dir.', 'Scan File', 'Pulsar Params', 'PRF', 'Index', 'DB', 'Filter', 'Reject', 'TCG'].map(text => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 14, color: 'FFFFFF' })] })],
        shading: { fill: '8b5cf6', type: ShadingType.SOLID, color: 'FFFFFF' },
      })),
    });

    const pulsarDataRows = enabledDetails.map(detail => {
      const extDetail = detail as typeof detail & {
        scanningFile?: string;
        pulsarParams?: string;
        prf?: number;
        indexMode?: string;
        db?: number;
        filter?: string;
        reject?: string;
        tcgMode?: boolean;
      };
      return new TableRow({
        children: [
          detail.scanningDirection,
          extDetail.scanningFile || '-',
          extDetail.pulsarParams || '-',
          extDetail.prf !== undefined ? `${extDetail.prf} Hz` : '-',
          extDetail.indexMode || '-',
          extDetail.db !== undefined ? `${extDetail.db} dB` : '-',
          extDetail.filter || '-',
          extDetail.reject || '-',
          extDetail.tcgMode !== undefined ? (extDetail.tcgMode ? 'ON' : 'OFF') : '-',
        ].map(text => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, size: 14 })] })],
        })),
      });
    });

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [pulsarHeaderRow, ...pulsarDataRows],
    }));
  }

  // Documentation (matching PDF structure)
  children.push(new Paragraph({
    children: [new TextRun({ text: '7. DOCUMENTATION', bold: true, size: 26 })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 400, after: 200 },
  }));

  // Inspector subsection (matching PDF)
  children.push(...createSubsection('Inspector', [
    ['Inspector Name', formatValue(documentation.inspectorName)],
    ['Certification Number', formatValue(documentation.inspectorCertification)],
    ['Level', formatValue(documentation.inspectorLevel)],
    ['Certifying Organization', formatValue(documentation.certifyingOrganization)],
  ]));

  // Customer & Document subsection (matching PDF)
  children.push(...createSubsection('Customer & Document', [
    ['Customer Name', formatValue(documentation.customerName)],
    ['Purchase Order', formatValue(documentation.purchaseOrder)],
    ['Part Serial Number', formatValue(documentation.serialNumber)],
    ['Inspection Date', formatDate(documentation.inspectionDate)],
    ['Procedure Number', formatValue(documentation.procedureNumber)],
    ['Drawing Reference', formatValue(documentation.drawingReference)],
    ['Revision', formatValue(documentation.revision)],
  ]));

  // Additional Notes (matching PDF)
  if (documentation.additionalNotes) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Additional Notes', bold: true, size: 22, color: '374151' })],
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 100 },
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: documentation.additionalNotes, size: 20 })],
      spacing: { before: 100, after: 200 },
    }));
  }

  // Technical Drawing (if available - matching PDF)
  if (data.capturedDrawing) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({
      children: [new TextRun({ text: 'TECHNICAL DRAWING', bold: true, size: 26 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 200 },
    }));

    try {
      const imageBuffer = base64ToArrayBuffer(data.capturedDrawing);
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: 'png',
            data: imageBuffer,
            transformation: { width: 500, height: 350 },
          }),
        ],
      }));
    } catch (e) {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Technical drawing could not be loaded.', italics: true, color: '6b7280' })],
      }));
    }
  }

  // Calibration Block Diagram (if available - matching PDF)
  if (data.calibrationBlockDiagram) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({
      children: [new TextRun({ text: 'CALIBRATION BLOCK DIAGRAM', bold: true, size: 26 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 200 },
    }));

    try {
      const imageBuffer = base64ToArrayBuffer(data.calibrationBlockDiagram);
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: 'png',
            data: imageBuffer,
            transformation: { width: 500, height: 300 },
          }),
        ],
      }));
    } catch (e) {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Calibration block diagram could not be loaded.', italics: true, color: '6b7280' })],
      }));
    }
  }

  // Angle Beam Diagram (if available - matching PDF for circular parts)
  if (data.angleBeamDiagram) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({
      children: [new TextRun({ text: 'ANGLE BEAM CALIBRATION BLOCK', bold: true, size: 26 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }));
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Shear Wave / Circumferential Inspection Reference Block', size: 18, color: '6b7280' })],
      spacing: { after: 200 },
    }));

    try {
      const imageBuffer = base64ToArrayBuffer(data.angleBeamDiagram);
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: 'png',
            data: imageBuffer,
            transformation: { width: 500, height: 300 },
          }),
        ],
      }));
    } catch (e) {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Angle beam calibration block diagram could not be loaded.', italics: true, color: '6b7280' })],
      }));
    }
  }

  // E2375 Scan Directions Diagram (if available - matching PDF)
  if (data.e2375Diagram) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({
      children: [new TextRun({ text: 'ASTM E2375 SCAN DIRECTIONS DIAGRAM', bold: true, size: 26 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }));
    children.push(new Paragraph({
      children: [new TextRun({
        text: `Standard Practice for Ultrasonic Testing of Wrought Products - ${formatPartType(inspectionSetup.partType)}`,
        size: 18,
        color: '6b7280'
      })],
      spacing: { after: 200 },
    }));

    try {
      const imageBuffer = base64ToArrayBuffer(data.e2375Diagram);
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: 'png',
            data: imageBuffer,
            transformation: { width: 500, height: 350 },
          }),
        ],
      }));
      children.push(new Paragraph({
        children: [new TextRun({
          text: 'Reference: ASTM E2375-16 "Standard Practice for Ultrasonic Testing of Wrought Products"',
          size: 16,
          color: '6b7280',
          italics: true
        })],
        spacing: { before: 100 },
      }));
    } catch (e) {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'E2375 scan directions diagram could not be loaded.', italics: true, color: '6b7280' })],
      }));
    }
  }

  // Scan Directions Drawing (if available - matching PDF)
  if (data.scanDirectionsDrawing) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new Paragraph({
      children: [new TextRun({ text: 'SCAN DIRECTIONS - INSPECTION PLAN', bold: true, size: 26 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 200 },
    }));

    try {
      const imageBuffer = base64ToArrayBuffer(data.scanDirectionsDrawing);
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: 'png',
            data: imageBuffer,
            transformation: { width: 500, height: 350 },
          }),
        ],
      }));
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: 'Figure: Inspection plan showing selected scanning directions with entry surfaces and beam paths.',
          size: 18,
          color: '6b7280',
          italics: true
        })],
        spacing: { before: 100 },
      }));
    } catch (e) {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Scan directions drawing could not be loaded.', italics: true, color: '6b7280' })],
      }));
    }
  }

  // Approvals & Signatures
  children.push(...buildApprovalsSection(documentation as ExtendedDocumentationData, documentation.approvalRequired));

  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  // Generate filename
  const partNumber = inspectionSetup.partNumber || 'TechniqueSheet';
  const date = new Date().toISOString().split('T')[0];
  const filename = `${partNumber}_TechniqueSheet_${date}.docx`;

  // Export
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

export default exportTechniqueSheetWord;
