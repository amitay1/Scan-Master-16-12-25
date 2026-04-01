// @ts-nocheck
/**
 * TechniqueSheetWord - Professional Word Export for Technique Sheets
 *
 * Creates professional DOCX documents using the docx library.
 * SYNCHRONIZED WITH TechniqueSheetPDF.ts - Both exports must have identical content and styling.
 *
 * Design matches PDF: FRISA/TUV professional style with:
 * - Blue header bars with gold accents
 * - Document info boxes
 * - Professional table styling
 * - Alternating row colors
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
  ShadingType,
  PageBreak,
  ImageRun,
  Header,
  Footer,
  PageNumber,
  BorderStyle,
  convertInchesToTwip,
  VerticalAlign,
  TableLayoutType,
} from 'docx';
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
  formatTransducerShape,
  formatAcceptanceClass,
  getPartDimensionRows,
  getMaterialWarning,
} from './exportHelpers';

// ============================================================================
// COLORS - Matching PDF TUV-style blue theme (hex values for docx)
// ============================================================================
const WORD_COLORS = {
  primary: '163A59',
  primaryDark: '0F2740',
  secondary: '3B6C93',
  accent: 'D0872F',
  accentGold: 'D0872F',

  // Background colors
  headerBg: 'F4F7FA',
  sectionBg: 'EEF3F7',
  rowAlt: 'FAFBFD',
  labelBg: 'F1F5F9',
  white: 'FFFFFF',

  // Border colors
  tableBorder: 'D5DEE8',
  divider: 'E4EAF0',

  // Text colors
  text: '17212B',
  lightText: '5B6775',
  mutedText: '7F8B98',
};

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
  showLogoOnEveryPage?: boolean; // When false, hide logo from all pages (default: true)
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
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const getPngDimensions = (bytes: Uint8Array): { width: number; height: number } | null => {
  if (bytes.length < 24) return null;
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) return null;
  }

  const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
  return width > 0 && height > 0 ? { width, height } : null;
};

const getJpegDimensions = (bytes: Uint8Array): { width: number; height: number } | null => {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    const size = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (size < 2) break;

    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker);

    if (isStartOfFrame && offset + 8 < bytes.length) {
      const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
      const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
      return width > 0 && height > 0 ? { width, height } : null;
    }

    offset += 2 + size;
  }

  return null;
};

const getImageDimensions = (buffer: ArrayBuffer): { width: number; height: number } | null => {
  const bytes = new Uint8Array(buffer);
  return getPngDimensions(bytes) || getJpegDimensions(bytes);
};

const fitImageToBox = (
  imageWidth: number | undefined,
  imageHeight: number | undefined,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  if (!imageWidth || !imageHeight || imageWidth <= 0 || imageHeight <= 0) {
    return { width: maxWidth, height: maxHeight };
  }

  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
  return {
    width: Math.max(1, Math.round(imageWidth * scale)),
    height: Math.max(1, Math.round(imageHeight * scale)),
  };
};

// ============================================================================
// COVER PAGE HEADER BAR (matching PDF FRISA style)
// ============================================================================
const createCoverHeader = (
  docNum: string,
  revision: string,
  dateStr: string,
  companyName?: string,
  companyLogo?: string
): Table => {
  const headerCells: TableCell[] = [];

  if (companyLogo) {
    try {
      const logoBuffer = base64ToArrayBuffer(companyLogo);
      headerCells.push(
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  type: 'png',
                  data: logoBuffer,
                  transformation: { width: 70, height: 50 },
                }),
              ],
            }),
          ],
          shading: { fill: WORD_COLORS.white, type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
            left: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
            right: { style: BorderStyle.NONE },
          },
          width: { size: 12, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          margins: {
            top: convertInchesToTwip(0.12),
            bottom: convertInchesToTwip(0.12),
            left: convertInchesToTwip(0.12),
            right: convertInchesToTwip(0.12),
          },
        })
      );
    } catch {
      // If logo fails to load, skip it.
    }
  }

  const leftContent: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: 'UT TECHNIQUE SHEET',
          bold: true,
          size: 32,
          color: WORD_COLORS.primaryDark,
        }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Ultrasonic inspection procedure and execution data package',
          size: 18,
          color: WORD_COLORS.lightText,
        }),
      ],
      spacing: { after: 40 },
    }),
  ];

  if (companyName) {
    leftContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: companyName,
            bold: true,
            size: 18,
            color: WORD_COLORS.secondary,
          }),
        ],
      })
    );
  }

  const titleWidth = companyLogo ? 50 : 58;

  headerCells.push(
    new TableCell({
      children: leftContent,
      shading: { fill: WORD_COLORS.headerBg, type: ShadingType.CLEAR },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
        left: { style: companyLogo ? BorderStyle.NONE : BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
        right: { style: BorderStyle.NONE },
      },
      width: { size: titleWidth, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.CENTER,
      margins: {
        top: convertInchesToTwip(0.18),
        bottom: convertInchesToTwip(0.18),
        left: convertInchesToTwip(0.16),
        right: convertInchesToTwip(0.12),
      },
    })
  );

  const infoBoxContent: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: 'Document No.', size: 14, color: WORD_COLORS.mutedText }),
      ],
      spacing: { after: 20 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: docNum, bold: true, size: 18, color: WORD_COLORS.primaryDark }),
      ],
      spacing: { after: 70 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Revision', size: 14, color: WORD_COLORS.mutedText }),
      ],
      spacing: { after: 20 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: revision, bold: true, size: 18, color: WORD_COLORS.primaryDark }),
      ],
      spacing: { after: 70 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Inspection Date', size: 14, color: WORD_COLORS.mutedText }),
      ],
      spacing: { after: 20 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: dateStr, bold: true, size: 18, color: WORD_COLORS.primaryDark }),
      ],
    }),
  ];

  headerCells.push(
    new TableCell({
      children: infoBoxContent,
      shading: { fill: WORD_COLORS.white, type: ShadingType.CLEAR },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
      },
      width: { size: companyLogo ? 38 : 42, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.CENTER,
      margins: {
        top: convertInchesToTwip(0.16),
        bottom: convertInchesToTwip(0.16),
        left: convertInchesToTwip(0.16),
        right: convertInchesToTwip(0.16),
      },
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: headerCells,
        height: { value: convertInchesToTwip(1.15), rule: 'atLeast' as const },
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [] })],
            shading: { fill: WORD_COLORS.accent, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            columnSpan: headerCells.length,
          }),
        ],
        height: { value: convertInchesToTwip(0.05), rule: 'exact' as const },
      }),
    ],
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
  });
};

// ============================================================================
// SECTION TITLE (matching PDF addSectionTitle)
// ============================================================================
const createSectionTitle = (title: string): Table => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [] })],
            shading: { fill: WORD_COLORS.accent, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            width: { size: 1, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 24,
                    color: WORD_COLORS.primaryDark,
                  }),
                ],
                alignment: AlignmentType.LEFT,
              }),
            ],
            shading: { fill: WORD_COLORS.sectionBg, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
            },
            width: { size: 99, type: WidthType.PERCENTAGE },
            margins: {
              top: convertInchesToTwip(0.07),
              bottom: convertInchesToTwip(0.07),
              left: convertInchesToTwip(0.15),
              right: convertInchesToTwip(0.1),
            },
          }),
        ],
      }),
    ],
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
  });
};

// ============================================================================
// SUBSECTION TITLE (matching PDF addSubsectionTitle)
// ============================================================================
const createSubsectionTitle = (title: string): Table => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [] })],
            shading: { fill: WORD_COLORS.secondary, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            width: { size: 1, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 18,
                    color: WORD_COLORS.secondary,
                  }),
                ],
              }),
            ],
            shading: { fill: WORD_COLORS.headerBg, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.divider },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.divider },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            width: { size: 99, type: WidthType.PERCENTAGE },
            margins: {
              top: convertInchesToTwip(0.06),
              bottom: convertInchesToTwip(0.06),
              left: convertInchesToTwip(0.12),
              right: convertInchesToTwip(0.1),
            },
          }),
        ],
      }),
    ],
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
  });
};

// ============================================================================
// DOCUMENT SUMMARY TABLE (4-column layout matching PDF)
// ============================================================================
const createDocumentSummaryTable = (
  data: TechniqueSheetWordExportData,
  standard: string
): Table => {
  const { inspectionSetup: setup, documentation: doc, acceptanceCriteria: acceptance, scanParameters } = data;

  const rows: string[][] = [
    ['Customer', formatValue(doc.customerName), 'Purchase Order', formatValue(doc.purchaseOrder)],
    ['Part Number', formatValue(setup.partNumber), 'Part Name', formatValue(setup.partName)],
    ['Material', formatMaterial(setup.material, setup.customMaterialName), 'Material Spec', formatValue(setup.materialSpec)],
    ['Part Type', formatPartType(setup.partType), 'Drawing No', formatValue(setup.drawingNumber)],
    ['Process Spec', formatValue(standard), 'Acceptance Class', formatAcceptanceClass(acceptance.acceptanceClass).class],
    ['Inspection Type', formatScanMethod(scanParameters.scanMethod), 'Criticality', formatAcceptanceClass(acceptance.acceptanceClass).description.split(' - ')[0] || '-'],
  ];

  const tableRows = rows.map((row, rowIndex) => {
    return new TableRow({
      children: row.map((cell, cellIndex) => {
        const isLabel = cellIndex % 2 === 0;
        const isAcceptanceClass = rowIndex === 4 && cellIndex === 3;

        return new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: cell,
                  bold: isLabel || isAcceptanceClass,
                  size: isAcceptanceClass ? 22 : (isLabel ? 14 : 18),
                  color: isLabel ? WORD_COLORS.mutedText : (isAcceptanceClass ? WORD_COLORS.primaryDark : WORD_COLORS.text),
                }),
              ],
            }),
          ],
          shading: isLabel ? { fill: WORD_COLORS.labelBg, type: ShadingType.CLEAR } : { fill: rowIndex % 2 === 0 ? WORD_COLORS.white : WORD_COLORS.rowAlt, type: ShadingType.CLEAR },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
            left: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
            right: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
          },
          width: { size: isLabel ? 16 : 34, type: WidthType.PERCENTAGE },
          margins: {
            top: convertInchesToTwip(0.06),
            bottom: convertInchesToTwip(0.06),
            left: convertInchesToTwip(0.08),
            right: convertInchesToTwip(0.08),
          },
        });
      }),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: WORD_COLORS.tableBorder },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: WORD_COLORS.tableBorder },
      left: { style: BorderStyle.SINGLE, size: 6, color: WORD_COLORS.tableBorder },
      right: { style: BorderStyle.SINGLE, size: 6, color: WORD_COLORS.tableBorder },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
    },
  });
};

// ============================================================================
// KEY-VALUE TABLE (2 columns with header)
// ============================================================================
const createKeyValueTable = (
  rows: [string, string][],
  headerText?: string,
  headerColor?: string
): Table => {
  const tableRows: TableRow[] = [];

  // Optional header row
  if (headerText) {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Parameter',
                    bold: true,
                    size: 17,
                    color: WORD_COLORS.primaryDark,
                  }),
                ],
              }),
            ],
            shading: { fill: WORD_COLORS.headerBg, type: ShadingType.CLEAR },
            width: { size: 32, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
              left: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
              right: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
            },
            margins: {
              top: convertInchesToTwip(0.05),
              bottom: convertInchesToTwip(0.05),
              left: convertInchesToTwip(0.1),
              right: convertInchesToTwip(0.1),
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Value',
                    bold: true,
                    size: 17,
                    color: headerColor || WORD_COLORS.primaryDark,
                  }),
                ],
              }),
            ],
            shading: { fill: WORD_COLORS.headerBg, type: ShadingType.CLEAR },
            width: { size: 68, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
              left: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
              right: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
            },
            margins: {
              top: convertInchesToTwip(0.05),
              bottom: convertInchesToTwip(0.05),
              left: convertInchesToTwip(0.1),
              right: convertInchesToTwip(0.1),
            },
          }),
        ],
      })
    );
  }

  // Data rows
  rows.forEach(([label, value], index) => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: label,
                    bold: true,
                    size: 16,
                    color: WORD_COLORS.lightText,
                  }),
                ],
              }),
            ],
            shading: { fill: WORD_COLORS.labelBg, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
              left: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
              right: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
            },
            width: { size: 32, type: WidthType.PERCENTAGE },
            margins: {
              top: convertInchesToTwip(0.06),
              bottom: convertInchesToTwip(0.06),
              left: convertInchesToTwip(0.1),
              right: convertInchesToTwip(0.1),
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: value,
                    size: 18,
                    color: WORD_COLORS.text,
                  }),
                ],
              }),
            ],
            shading: { fill: index % 2 === 1 ? WORD_COLORS.rowAlt : WORD_COLORS.white, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
              left: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
              right: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
            },
            width: { size: 68, type: WidthType.PERCENTAGE },
            margins: {
              top: convertInchesToTwip(0.06),
              bottom: convertInchesToTwip(0.06),
              left: convertInchesToTwip(0.1),
              right: convertInchesToTwip(0.1),
            },
          }),
        ],
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
      left: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
      right: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
    },
  });
};

// ============================================================================
// WARNING BOX
// ============================================================================
const createWarningBox = (text: string): Table => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Note: ${text}`,
                    size: 18,
                    color: '856404',
                  }),
                ],
              }),
            ],
            shading: { fill: 'FFF3CD', type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'FFE69C' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'FFE69C' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'FFE69C' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'FFE69C' },
            },
            margins: {
              top: convertInchesToTwip(0.08),
              bottom: convertInchesToTwip(0.08),
              left: convertInchesToTwip(0.1),
              right: convertInchesToTwip(0.1),
            },
          }),
        ],
      }),
    ],
  });
};

// ============================================================================
// PART SKETCH SECTION HEADER
// ============================================================================
const createNoticeBox = (text: string): Table => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [] })],
            shading: { fill: WORD_COLORS.secondary, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            width: { size: 1, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text, size: 16, color: WORD_COLORS.lightText })],
              }),
            ],
            shading: { fill: WORD_COLORS.headerBg, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.divider },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.divider },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.divider },
            },
            margins: {
              top: convertInchesToTwip(0.08),
              bottom: convertInchesToTwip(0.08),
              left: convertInchesToTwip(0.1),
              right: convertInchesToTwip(0.1),
            },
          }),
        ],
      }),
    ],
  });
};

const createImageSection = (
  title: string,
  subtitle: string | undefined,
  imageBase64: string | undefined,
  maxWidth: number,
  maxHeight: number,
  missingMessage: string
): (Paragraph | Table)[] => {
  const elements: (Paragraph | Table)[] = [];
  elements.push(createSectionTitle(title));
  elements.push(new Paragraph({
    children: subtitle ? [new TextRun({ text: subtitle, size: 16, color: WORD_COLORS.lightText })] : [],
    spacing: { after: subtitle ? 140 : 80 },
  }));

  if (imageBase64) {
    try {
      const imageBuffer = base64ToArrayBuffer(imageBase64);
      const sourceSize = getImageDimensions(imageBuffer);
      const fittedSize = fitImageToBox(
        sourceSize?.width,
        sourceSize?.height,
        maxWidth,
        maxHeight
      );

      elements.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        type: 'png',
                        data: imageBuffer,
                        transformation: fittedSize,
                      }),
                    ],
                  }),
                ],
                shading: { fill: WORD_COLORS.white, type: ShadingType.CLEAR },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
                  left: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
                  right: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
                },
                margins: {
                  top: convertInchesToTwip(0.12),
                  bottom: convertInchesToTwip(0.12),
                  left: convertInchesToTwip(0.12),
                  right: convertInchesToTwip(0.12),
                },
              }),
            ],
          }),
        ],
      }));
    } catch {
      elements.push(new Paragraph({
        children: [new TextRun({ text: missingMessage, italics: true, color: WORD_COLORS.lightText })],
      }));
    }
  } else {
    elements.push(createNoticeBox(missingMessage));
  }

  elements.push(new Paragraph({ children: [], spacing: { after: 180 } }));
  return elements;
};

const createPartSketchSectionHeader = (): Table => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          // Secondary color accent
          new TableCell({
            children: [new Paragraph({ children: [] })],
            shading: { fill: WORD_COLORS.secondary, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            width: { size: 2, type: WidthType.PERCENTAGE },
          }),
          // Light background with title
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'PART SKETCH / DIMENSIONS',
                    bold: true,
                    size: 22,
                    color: WORD_COLORS.secondary,
                  }),
                ],
              }),
            ],
            shading: { fill: WORD_COLORS.sectionBg, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            width: { size: 98, type: WidthType.PERCENTAGE },
            margins: {
              top: convertInchesToTwip(0.08),
              bottom: convertInchesToTwip(0.08),
              left: convertInchesToTwip(0.15),
              right: convertInchesToTwip(0.1),
            },
          }),
        ],
      }),
    ],
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
  });
};

// ============================================================================
// KEY DIMENSIONS LINE
// ============================================================================
const createKeyDimensionsLine = (setup: InspectionSetupData): Paragraph | null => {
  const dimensionRows = getPartDimensionRows(setup);
  if (dimensionRows.length === 0) return null;

  const parts: TextRun[] = [
    new TextRun({
      text: 'Key Dimensions:  ',
      bold: true,
      size: 18,
      color: WORD_COLORS.primary,
    }),
  ];

  dimensionRows.slice(0, 4).forEach((dim, i) => {
    if (i > 0) {
      parts.push(new TextRun({ text: '  |  ', size: 16, color: WORD_COLORS.lightText }));
    }
    parts.push(new TextRun({ text: `${dim[0]}: `, size: 16, color: WORD_COLORS.lightText }));
    parts.push(new TextRun({ text: dim[1], bold: true, size: 16, color: WORD_COLORS.text }));
  });

  return new Paragraph({
    children: parts,
    shading: { fill: WORD_COLORS.sectionBg, type: ShadingType.CLEAR, color: WORD_COLORS.sectionBg },
    spacing: { before: 100, after: 200 },
  });
};

// ============================================================================
// TABLE OF CONTENTS
// ============================================================================
const buildTableOfContents = (hasDrawing: boolean, hasScanDetails: boolean, hasAngleBeam: boolean): (Paragraph | Table)[] => {
  const elements: (Paragraph | Table)[] = [];

  elements.push(createSectionTitle('TABLE OF CONTENTS'));
  elements.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  const tocItems: string[] = [
    '1. Part Information',
    '2. Equipment',
    '3. Scan Parameters',
    '4. Acceptance Criteria',
  ];

  let sectionNum = 5;

  if (hasScanDetails) {
    tocItems.push(`${sectionNum}. Scan Details & Directions`);
    tocItems.push(`   ${sectionNum}.1 Scanning Directions`);
    if (hasDrawing) {
      tocItems.push(`   ${sectionNum}.2 Technical Drawing`);
    }
    sectionNum++;
  }

  tocItems.push(`${sectionNum}. Documentation`);
  sectionNum++;

  tocItems.push(`${sectionNum}. Calibration / Reference Standard`);
  tocItems.push(`   ${sectionNum}.1 FBH Table`);
  tocItems.push(`   ${sectionNum}.2 Calibration Block Diagram`);
  if (hasAngleBeam) {
    tocItems.push(`   ${sectionNum}.3 Angle Beam Calibration Block`);
  }
  sectionNum++;

  tocItems.push(`${sectionNum}. Approvals & Signatures`);

  tocItems.forEach(item => {
    const isSubsection = item.startsWith('   ');
    elements.push(new Paragraph({
      children: [new TextRun({
        text: isSubsection ? item.trim() : item,
        size: isSubsection ? 18 : 20,
        bold: !isSubsection,
        color: isSubsection ? WORD_COLORS.lightText : WORD_COLORS.text,
      })],
      spacing: { before: isSubsection ? 60 : 120, after: isSubsection ? 60 : 120 },
      indent: { left: isSubsection ? 400 : 0 },
    }));
  });

  elements.push(new Paragraph({
    children: [new TextRun({
      text: 'Note: Page numbers may vary based on content.',
      italics: true,
      size: 16,
      color: WORD_COLORS.mutedText,
    })],
    spacing: { before: 300, after: 200 },
    alignment: AlignmentType.CENTER,
  }));

  elements.push(new Paragraph({ children: [new PageBreak()] }));

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

  elements.push(createSectionTitle('8. APPROVALS & DOCUMENT CONTROL'));
  elements.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // Revision History subsection
  elements.push(createSubsectionTitle('Revision History'));
  elements.push(new Paragraph({ children: [], spacing: { after: 100 } }));

  // Revision history table
  const revisionHeaders = ['Rev', 'Date', 'Description', 'Prepared By', 'Approved By', 'Sign'];
  const revisionHeaderRow = new TableRow({
    children: revisionHeaders.map(text => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text, bold: true, size: 16, color: 'FFFFFF' })],
        alignment: AlignmentType.CENTER,
      })],
      shading: { fill: WORD_COLORS.primary, type: ShadingType.CLEAR },
      margins: {
        top: convertInchesToTwip(0.04),
        bottom: convertInchesToTwip(0.04),
        left: convertInchesToTwip(0.04),
        right: convertInchesToTwip(0.04),
      },
    })),
  });

  const revisionDataRows = [
    new TableRow({
      children: [
        documentation.revision || 'A',
        formatDate(documentation.inspectionDate),
        'Initial Release',
        documentation.inspectorName || '',
        '',
        '',
      ].map(text => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text, size: 16 })],
        })],
        margins: {
          top: convertInchesToTwip(0.04),
          bottom: convertInchesToTwip(0.04),
          left: convertInchesToTwip(0.04),
          right: convertInchesToTwip(0.04),
        },
      })),
    }),
    new TableRow({
      children: Array(6).fill(null).map(() => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: '', size: 16 })] })],
        margins: {
          top: convertInchesToTwip(0.04),
          bottom: convertInchesToTwip(0.04),
          left: convertInchesToTwip(0.04),
          right: convertInchesToTwip(0.04),
        },
      })),
    }),
  ];

  elements.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [revisionHeaderRow, ...revisionDataRows],
  }));

  elements.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // Approval Signatures subsection
  elements.push(createSubsectionTitle('Approval Signatures'));
  elements.push(new Paragraph({ children: [], spacing: { after: 100 } }));

  const signatureHeaders = ['Role', 'Name (Print)', 'Cert. Number', 'Date', 'Signature'];
  const signatureHeaderRow = new TableRow({
    children: signatureHeaders.map(text => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text, bold: true, size: 16, color: 'FFFFFF' })],
        alignment: AlignmentType.CENTER,
      })],
      shading: { fill: WORD_COLORS.secondary, type: ShadingType.CLEAR },
      margins: {
        top: convertInchesToTwip(0.04),
        bottom: convertInchesToTwip(0.04),
        left: convertInchesToTwip(0.04),
        right: convertInchesToTwip(0.04),
      },
    })),
  });

  const signatureRoles = [
    ['UT Inspector (Level II)', documentation.inspectorName || '', documentation.inspectorCertification || '', formatDate(documentation.inspectionDate), ''],
    ['Level III Review', documentation.levelIIIName || '', '', formatDate(documentation.levelIIIDate), ''],
    ['Quality Assurance', '', '', '', ''],
  ];

  if (approvalRequired) {
    signatureRoles.push(['Customer Representative', '', '', '', '']);
  }

  const signatureDataRows = signatureRoles.map(row => new TableRow({
    children: row.map((text, i) => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text, bold: i === 0, size: 16 })],
      })],
      margins: {
        top: convertInchesToTwip(0.04),
        bottom: convertInchesToTwip(0.04),
        left: convertInchesToTwip(0.04),
        right: convertInchesToTwip(0.04),
      },
    })),
  }));

  elements.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [signatureHeaderRow, ...signatureDataRows],
  }));

  // Notice if approval required
  if (approvalRequired) {
    elements.push(new Paragraph({ children: [], spacing: { after: 100 } }));
    elements.push(createNoticeBox('Notice: This technique sheet requires Level III approval before use in production.'));
  }

  elements.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // Document Control Footer
  elements.push(new Paragraph({
    children: [new TextRun({ text: 'DOCUMENT CONTROL', bold: true, size: 18, color: WORD_COLORS.primary })],
    spacing: { before: 200, after: 100 },
  }));

  elements.push(new Paragraph({
    children: [new TextRun({
      text: 'This is a controlled document. Unauthorized reproduction, modification, or distribution is strictly prohibited.',
      size: 16,
      color: WORD_COLORS.lightText,
    })],
    spacing: { after: 50 },
  }));

  elements.push(new Paragraph({
    children: [new TextRun({
      text: 'Printed copies are uncontrolled unless stamped "CONTROLLED COPY" with a valid date.',
      size: 16,
      color: WORD_COLORS.lightText,
    })],
    spacing: { after: 50 },
  }));

  elements.push(new Paragraph({
    children: [new TextRun({
      text: `Document generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | Scan-Master v1.0`,
      italics: true,
      size: 16,
      color: WORD_COLORS.mutedText,
    })],
    spacing: { before: 100 },
  }));

  return elements;
};

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================
export interface BuiltTechniqueSheetWordDocument {
  document: Document;
  filename: string;
}

export const getTechniqueSheetWordFilename = (partNumber?: string): string => {
  const safePartNumber = partNumber || 'TechniqueSheet';
  const date = new Date().toISOString().split('T')[0];
  return `${safePartNumber}_TechniqueSheet_${date}.docx`;
};

export function buildTechniqueSheetWordDocument(
  data: TechniqueSheetWordExportData,
  options: WordExportOptions = {}
): BuiltTechniqueSheetWordDocument {
  const { inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria, documentation, scanDetails } = data;

  const children: (Paragraph | Table)[] = [];

  // Document info
  const docNum = documentation.procedureNumber || `TS-${inspectionSetup.partNumber || 'XXX'}`;
  const revision = documentation.revision || 'A';
  const dateStr = formatDate(documentation.inspectionDate);

  // ========== COVER PAGE ==========
  // Header bar with document info
  const effectiveLogo = options.showLogoOnEveryPage !== false ? options.companyLogo : undefined;
  children.push(createCoverHeader(docNum, revision, dateStr, options.companyName, effectiveLogo));
  children.push(new Paragraph({ children: [], spacing: { after: 300 } }));

  children.push(createSectionTitle('DOCUMENT SUMMARY'));
  children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

  children.push(createDocumentSummaryTable(data, data.standard));
  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  if (data.capturedDrawing) {
    children.push(...createImageSection(
      'PART SKETCH / DIMENSIONS',
      'Captured drawing from the setup and technical drawing workspace.',
      data.capturedDrawing,
      560,
      320,
      'Part sketch could not be loaded.'
    ));
  } else {
    children.push(createNoticeBox('Technical drawing is not attached. Export the drawing capture from the Setup / Technical Drawing workspace to include it in the Word document.'));
  }

  children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

  // Key Dimensions line
  const keyDimsLine = createKeyDimensionsLine(inspectionSetup);
  if (keyDimsLine) {
    children.push(keyDimsLine);
  }

  // Page break after cover
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ========== 1. PART INFORMATION ==========
  children.push(createSectionTitle('1. PART INFORMATION'));
  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  children.push(createKeyValueTable([
    ['Part Number', formatValue(inspectionSetup.partNumber)],
    ['Part Name', formatValue(inspectionSetup.partName)],
    ['Material', formatMaterial(inspectionSetup.material, inspectionSetup.customMaterialName)],
    ['Material Specification', formatValue(inspectionSetup.materialSpec)],
    ['Part Type / Geometry', formatPartType(inspectionSetup.partType)],
    ['Drawing Number', formatValue(inspectionSetup.drawingNumber)],
    ['Heat Treatment', formatValue(inspectionSetup.heatTreatment)],
  ], 'Part Info'));

  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // Dimensions subsection
  const dimensionRows = getPartDimensionRows(inspectionSetup);
  if (dimensionRows.length > 0) {
    children.push(createSubsectionTitle('Dimensions'));
    children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
    children.push(createKeyValueTable(dimensionRows.map(row => [row[0], row[1]] as [string, string]), undefined, WORD_COLORS.secondary));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  }

  // Material Properties subsection (acoustic velocity removed per requirements)
  if (inspectionSetup.materialDensity) {
    const matProps: [string, string][] = [
      ['Material Density', formatNumber(inspectionSetup.materialDensity, 0, 'kg/m3')],
    ];
    children.push(createSubsectionTitle('Material Properties'));
    children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
    children.push(createKeyValueTable(matProps));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  }

  // Material Warning
  const materialWarning = getMaterialWarning(inspectionSetup.material, data.standard);
  if (materialWarning) {
    children.push(createNoticeBox(`Material warning: ${materialWarning}`));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  }

  // ========== 2. EQUIPMENT ==========
  children.push(createSectionTitle('2. EQUIPMENT'));
  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  children.push(createKeyValueTable([
    ['Manufacturer', formatValue(equipment.manufacturer)],
    ['Model', formatValue(equipment.model)],
    ['Serial Number', formatValue(equipment.serialNumber)],
    ['Software Version', formatValue(equipment.softwareVersion)],
  ], 'Equipment'));

  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

  const transducerTypeDisplay = equipment.transducerTypes?.length
    ? equipment.transducerTypes.map((type) => formatTransducerType(type)).join(', ')
    : formatTransducerType(equipment.transducerType);
  const transducerShapeDisplay = formatTransducerShape(equipment.transducerShapeAndSize);

  children.push(createKeyValueTable([
    ['Frequency', equipment.frequency ? `${equipment.frequency} MHz` : '-'],
    ['Type', transducerTypeDisplay],
    ['Transducer Shape & Size', transducerShapeDisplay],
    ['Element Diameter', equipment.transducerDiameter ? formatNumber(equipment.transducerDiameter, 3, 'inches') : '-'],
    ['Couplant', formatValue(equipment.customCouplant || equipment.couplant)],
    ['Selection Notes', equipment.includeSelectionNotesInReport ? formatValue(equipment.selectionNotes) : '-'],
  ], undefined, WORD_COLORS.secondary));

  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // Performance Parameters
  children.push(createSubsectionTitle('Performance Parameters'));
  children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

  children.push(createKeyValueTable([
    ['Entry Surface Resolution', equipment.entrySurfaceResolution ? formatNumber(equipment.entrySurfaceResolution, 3, 'inches') : '-'],
    ['Back Surface Resolution', equipment.backSurfaceResolution ? formatNumber(equipment.backSurfaceResolution, 3, 'inches') : '-'],
  ]));

  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // Phased Array Configuration (if applicable)
  if (equipment.numberOfElements || equipment.elementPitch || equipment.wedgeModel || equipment.wedgeType) {
    const paConfig: [string, string][] = [];
    if (equipment.numberOfElements) paConfig.push(['Number of Elements', String(equipment.numberOfElements)]);
    if (equipment.elementPitch) paConfig.push(['Element Pitch', formatNumber(equipment.elementPitch, 2, 'mm')]);
    if (equipment.wedgeModel) paConfig.push(['Wedge Model', formatValue(equipment.wedgeModel)]);
    if (equipment.wedgeType) paConfig.push(['Wedge Type', formatValue(equipment.wedgeType)]);
    if (equipment.delayLine) paConfig.push(['Delay Line', formatValue(equipment.delayLine)]);

    if (paConfig.length > 0) {
      children.push(createSubsectionTitle('Phased Array Configuration'));
      children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
      children.push(createKeyValueTable(paConfig, undefined, '800080')); // Purple for PA
      children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    }
  }

  // ========== 3. SCAN PARAMETERS ==========
  children.push(createSectionTitle('3. SCAN PARAMETERS'));
  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  children.push(createKeyValueTable([
    ['Scan Method', formatScanMethod(scanParameters.scanMethod)],
    ['Technique', formatTechnique(scanParameters.technique)],
    ['Scan Type', formatValue(scanParameters.scanType)],
    ['Scan Pattern', formatValue(scanParameters.scanPattern)],
    ['Coupling Method', formatValue(scanParameters.couplingMethod)],
  ], 'Scan Parameters'));

  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // Speed & Coverage
  children.push(createSubsectionTitle('Speed & Coverage'));
  children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

  children.push(createKeyValueTable([
    ['Scan Speed', scanParameters.scanSpeed ? formatNumber(scanParameters.scanSpeed, 0, 'mm/s') : '-'],
    ['Scan Index', scanParameters.scanIndex ? formatNumber(scanParameters.scanIndex, 0, '%') : '-'],
    ['Coverage', scanParameters.coverage ? `${scanParameters.coverage}%` : '-'],
    ['Water Path', scanParameters.waterPath ? formatNumber(scanParameters.waterPath, 1, 'mm') : '-'],
  ]));

  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // Instrument Settings
  children.push(createSubsectionTitle('Instrument Settings'));
  children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

  children.push(createKeyValueTable([
    ['Pulse Repetition Rate (PRF)', scanParameters.pulseRepetitionRate ? `${scanParameters.pulseRepetitionRate} Hz` : '-'],
  ]));

  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // Phased Array Settings (if applicable)
  if (scanParameters.couplingMethod === 'phased_array' && scanParameters.phasedArray) {
    const pa = scanParameters.phasedArray;
    const paSettings: [string, string][] = [];
    if (pa.refractedAngleStart) paSettings.push(['Refracted Angle Start', `${pa.refractedAngleStart} deg`]);
    if (pa.refractedAngleEnd) paSettings.push(['Refracted Angle End', `${pa.refractedAngleEnd} deg`]);
    if (pa.aperture) paSettings.push(['Aperture', String(pa.aperture)]);
    if (pa.focusLaws) paSettings.push(['Focus Laws', formatValue(pa.focusLaws)]);

    if (paSettings.length > 0) {
      children.push(createSubsectionTitle('Phased Array Settings'));
      children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
      children.push(createKeyValueTable(paSettings, undefined, '800080')); // Purple
      children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    }
  }

  // ========== 4. ACCEPTANCE CRITERIA ==========
  children.push(createSectionTitle('4. ACCEPTANCE CRITERIA'));
  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  const classInfo = formatAcceptanceClass(acceptanceCriteria.acceptanceClass);
  if (classInfo.class !== '-') {
    children.push(new Paragraph({
      children: [
        new TextRun({ text: 'ACCEPTANCE CLASS: ', bold: true, size: 24 }),
        new TextRun({ text: classInfo.class, bold: true, size: 28, color: WORD_COLORS.primaryDark }),
        new TextRun({ text: ` (${classInfo.description})`, size: 18, color: WORD_COLORS.lightText }),
      ],
      spacing: { before: 100, after: 200 },
    }));
  }

  children.push(createKeyValueTable([
    ['Single Discontinuity', formatValue(acceptanceCriteria.singleDiscontinuity)],
    ['Multiple Discontinuities', formatValue(acceptanceCriteria.multipleDiscontinuities)],
    ['Linear Discontinuity', formatValue(acceptanceCriteria.linearDiscontinuity)],
    ['Back Reflection Loss', acceptanceCriteria.backReflectionLoss ? `${acceptanceCriteria.backReflectionLoss}%` : '-'],
    ['Noise Level', formatValue(acceptanceCriteria.noiseLevel)],
  ]));

  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // Special Requirements
  if (acceptanceCriteria.specialRequirements) {
    children.push(createSubsectionTitle('Special Requirements'));
    children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
    children.push(new Paragraph({
      children: [new TextRun({ text: acceptanceCriteria.specialRequirements, size: 18 })],
      spacing: { after: 200 },
    }));
  }

  if (acceptanceCriteria.includeStandardNotesInReport && acceptanceCriteria.standardNotes) {
    children.push(createSubsectionTitle('Standard Notes'));
    children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
    children.push(new Paragraph({
      children: [new TextRun({ text: acceptanceCriteria.standardNotes, size: 18 })],
      spacing: { after: 200 },
    }));
  }

  // AMS-STD-2154 / MIL-STD-2154 Table 6 Notes
  if (
    acceptanceCriteria.includeStandardNotesInReport &&
    (data.standard === 'AMS-STD-2154E' || data.standard === 'MIL-STD-2154')
  ) {
    children.push(createSubsectionTitle('Table 6 - Ultrasonic Classes - Notes'));
    children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
    const table6Notes = [
      '1/ Any discontinuity with an indication greater than the response from a reference flat-bottom hole or equivalent notch at the estimated discontinuity depth of the size given (inches diameter) is not acceptable.',
      '2/ Multiple discontinuities with indications greater than the response from a reference flat-bottom hole or equivalent notch at the estimated discontinuity depth of the size given (inches diameter) are not acceptable if the centers of any two of these discontinuities are less than 1 inch apart. Not applicable to class C.',
      '3/ Any discontinuity longer than the length given with indications greater than the response given (flat-bottom hole or equivalent notch response) is not acceptable. Not applicable to class C.',
      '4/ Loss of back reflection greater than the percent given, when compared to non-defective material in a similar or like part, is not acceptable when this loss of back reflection is accompanied by an increase or decrease in noise signal (at least double the normal background noise signal) between the front and back surface. Applicable only to straight beam tests.',
      '5/ When inspecting titanium to class AA, the multiple discontinuity separation shall be 1/4 inch.',
      '6/ For class AAA single discontinuity, 50% of 2/64 = 25% of 3/64.',
      '7/ For class AAA linear and multiple discontinuities, 1/64 or 25% of 2/64 = 10% of 3/64.',
    ];
    for (const note of table6Notes) {
      children.push(new Paragraph({
        children: [new TextRun({ text: note, size: 16, italics: true })],
        spacing: { after: 80 },
      }));
    }
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  }

  // Material Warning in Acceptance section
  if (materialWarning) {
    children.push(createNoticeBox(`Material warning: ${materialWarning}`));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  }

  // ========== 5. SCAN DETAILS (if available) ==========
  if (scanDetails?.scanDetails && scanDetails.scanDetails.some(d => d.enabled)) {
    children.push(new Paragraph({ children: [], spacing: { before: 120, after: 20 } }));
    children.push(createSectionTitle('5. SCAN DETAILS & DIRECTIONS'));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

    const enabledDetails = scanDetails.scanDetails.filter(d => d.enabled);

    const formatEntrySurface = (entrySurface?: string): string => {
      if (!entrySurface) return '-';
      const surfaceLabels: Record<string, string> = {
        top: 'Top',
        bottom: 'Bottom',
        side: 'Side',
        od: 'OD',
        id: 'ID',
        end: 'End',
        radial: 'Radial',
      };
      return surfaceLabels[entrySurface] || entrySurface.replace(/_/g, ' ');
    };

    const formatWaveType = (waveMode?: string): string => {
      const normalized = (waveMode || '').toLowerCase();
      if (normalized.includes('shear')) return 'S';
      if (normalized.includes('long') || normalized.includes('dual')) return 'L';
      return '-';
    };

    const computeNearField = (detail: any): string => {
      const d = Number(detail.activeElementDiameter);
      const f = Number.parseFloat(detail.frequency || '');
      const v = Number(detail.velocity || 5920);
      if (!Number.isFinite(d) || d <= 0 || !Number.isFinite(f) || f <= 0 || !Number.isFinite(v) || v <= 0) {
        return '-';
      }
      const velocityMmUs = v / 1000;
      return `${((d * d * f) / (4 * velocityMmUs)).toFixed(2)} mm`;
    };

    const formatGate = (gate?: { position?: number | string; start?: number; length?: number; stop?: number; level?: number }): string => {
      if (!gate) return '-';
      if (gate.position !== undefined || gate.stop !== undefined) {
        const position = gate.position ?? '-';
        const start = gate.start ?? '-';
        const stop = gate.stop ?? '-';
        return `${position}-${start}-${stop}`;
      }
      return `${gate.start ?? '-'}-${gate.length ?? '-'}-${gate.level ?? '-'}%`;
    };

    const buildDetailParagraphs = (lines: Array<[string, string]>) => {
      const visibleLines = lines.filter(([, value]) => value && value !== '-');
      if (visibleLines.length === 0) {
        return [
          new Paragraph({
            children: [new TextRun({ text: '-', size: 14 })],
          }),
        ];
      }

      return visibleLines.map(([label, value], idx) => new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, bold: true, size: 14, color: WORD_COLORS.primaryDark }),
          new TextRun({ text: value, size: 14, color: WORD_COLORS.text }),
        ],
        spacing: { after: idx === visibleLines.length - 1 ? 0 : 25 },
      }));
    };

    const cellBorders = {
      top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
      left: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
      right: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
    };

    const columnWidths = [8, 22, 24, 18, 28] as const;
    const headerLabels = ['Dir.', 'Scan Setup', 'Search Unit / Probe', 'Acoustic Data', 'Instrument & Gates'];

    const headerRow = new TableRow({
      children: headerLabels.map((text, index) => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text, bold: true, size: 14, color: 'FFFFFF' })],
          alignment: AlignmentType.CENTER,
        })],
        shading: { fill: WORD_COLORS.primaryDark, type: ShadingType.CLEAR },
        borders: cellBorders,
        width: { size: columnWidths[index], type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
        margins: {
          top: convertInchesToTwip(0.04),
          bottom: convertInchesToTwip(0.04),
          left: convertInchesToTwip(0.04),
          right: convertInchesToTwip(0.04),
        },
      })),
    });

    const consolidatedRows = enabledDetails.map((detail, idx) => {
      const rowFill = idx % 2 === 1 ? WORD_COLORS.rowAlt : WORD_COLORS.white;
      const waveType = formatWaveType(detail.waveMode);
      const dirFill = waveType === 'S' ? 'DC3545' : waveType === 'L' ? '007AC2' : WORD_COLORS.secondary;
      const rangeDelay = detail.utRange !== undefined || detail.utDelay !== undefined
        ? `${detail.utRange ?? '-'} / ${detail.utDelay ?? '-'}`
        : '-';
      const prfDb = detail.prf !== undefined || detail.db !== undefined
        ? `${detail.prf ?? '-'} / ${detail.db ?? '-'}`
        : '-';
      const indexFilter = detail.indexMode || detail.filter
        ? `${detail.indexMode || '-'} / ${detail.filter || '-'}`
        : '-';
      const rejectTcg = detail.reject || detail.tcgMode !== undefined
        ? `${detail.reject || '-'} / ${detail.tcgMode === true ? 'YES' : detail.tcgMode === false ? 'NO' : '-'}`
        : '-';
      const attenBwe = detail.attenuation !== undefined || detail.backWallEcho !== undefined
        ? `${detail.attenuation ?? '-'} / ${detail.backWallEcho ?? '-'}`
        : '-';

      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: detail.scanningDirection || '-', bold: true, size: 16, color: 'FFFFFF' })],
              alignment: AlignmentType.CENTER,
            })],
            shading: { fill: dirFill, type: ShadingType.CLEAR },
            borders: cellBorders,
            width: { size: columnWidths[0], type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            margins: {
              top: convertInchesToTwip(0.04),
              bottom: convertInchesToTwip(0.04),
              left: convertInchesToTwip(0.03),
              right: convertInchesToTwip(0.03),
            },
          }),
          new TableCell({
            children: buildDetailParagraphs([
              ['Entry', formatEntrySurface(detail.entrySurface)],
              ['Wave', detail.waveMode ? `${waveType} | ${detail.waveMode}` : waveType],
              ['Angle', detail.angle !== undefined ? `${detail.angle}°` : '-'],
              ['Water Path', detail.waterPath !== undefined ? `${detail.waterPath} mm` : '-'],
              ['Remarks', detail.remarkDetails || '-'],
            ]),
            shading: { fill: rowFill, type: ShadingType.CLEAR },
            borders: cellBorders,
            width: { size: columnWidths[1], type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            margins: {
              top: convertInchesToTwip(0.04),
              bottom: convertInchesToTwip(0.04),
              left: convertInchesToTwip(0.05),
              right: convertInchesToTwip(0.05),
            },
          }),
          new TableCell({
            children: buildDetailParagraphs([
              ['Probe', detail.probe || '-'],
              ['Make', detail.make || '-'],
              ['P/N / S/N', detail.partNumber || detail.serialNumber ? `${detail.partNumber || '-'} / ${detail.serialNumber || '-'}` : '-'],
              ['Technique / Freq.', detail.technique || detail.frequency ? `${formatTechnique(detail.technique || scanParameters.technique)} / ${detail.frequency ? `${detail.frequency} MHz` : '-'}` : '-'],
              ['Wave Mode', detail.waveMode || '-'],
            ]),
            shading: { fill: rowFill, type: ShadingType.CLEAR },
            borders: cellBorders,
            width: { size: columnWidths[2], type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            margins: {
              top: convertInchesToTwip(0.04),
              bottom: convertInchesToTwip(0.04),
              left: convertInchesToTwip(0.05),
              right: convertInchesToTwip(0.05),
            },
          }),
          new TableCell({
            children: buildDetailParagraphs([
              ['Active Elem.', detail.activeElementDiameter !== undefined ? `${detail.activeElementDiameter} mm` : (detail.activeElement || '-')],
              ['Bandwidth', detail.bandwidth || '-'],
              ['Focus', detail.focusSize || '-'],
              ['Velocity / Near Field', detail.velocity !== undefined || computeNearField(detail) !== '-'
                ? `${detail.velocity !== undefined ? `${detail.velocity} m/s` : '-'} / ${computeNearField(detail)}`
                : '-'],
              ['SSS', detail.sss || '-'],
              ['Atten. / BWE', attenBwe],
            ]),
            shading: { fill: rowFill, type: ShadingType.CLEAR },
            borders: cellBorders,
            width: { size: columnWidths[3], type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            margins: {
              top: convertInchesToTwip(0.04),
              bottom: convertInchesToTwip(0.04),
              left: convertInchesToTwip(0.05),
              right: convertInchesToTwip(0.05),
            },
          }),
          new TableCell({
            children: buildDetailParagraphs([
              ['UT', detail.utParameter || detail.pulsarParams || '-'],
              ['Range / Delay', rangeDelay],
              ['PRF / dB', prfDb],
              ['Index / Filter', indexFilter],
              ['Reject / TCG', rejectTcg],
              ['G1', formatGate(detail.gate1)],
              ['G2', formatGate(detail.gate2)],
              ['G3', formatGate(detail.gate3)],
              ['G4', formatGate(detail.gate4)],
              ['File', detail.scanningFile || '-'],
            ]),
            shading: { fill: rowFill, type: ShadingType.CLEAR },
            borders: cellBorders,
            width: { size: columnWidths[4], type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.TOP,
            margins: {
              top: convertInchesToTwip(0.04),
              bottom: convertInchesToTwip(0.04),
              left: convertInchesToTwip(0.05),
              right: convertInchesToTwip(0.05),
            },
          }),
        ],
      });
    });

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      rows: [headerRow, ...consolidatedRows],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 6, color: WORD_COLORS.tableBorder },
        bottom: { style: BorderStyle.SINGLE, size: 6, color: WORD_COLORS.tableBorder },
        left: { style: BorderStyle.SINGLE, size: 6, color: WORD_COLORS.tableBorder },
        right: { style: BorderStyle.SINGLE, size: 6, color: WORD_COLORS.tableBorder },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
      },
    }));

    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // ========== 6. DOCUMENTATION ==========
  children.push(createSectionTitle('6. DOCUMENTATION'));
  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // Inspector subsection
  children.push(createSubsectionTitle('Inspector'));
  children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

  children.push(createKeyValueTable([
    ['Inspector Name', formatValue(documentation.inspectorName)],
    ['Certification Number', formatValue(documentation.inspectorCertification)],
    ['Level', formatValue(documentation.inspectorLevel)],
    ['Certifying Organization', formatValue(documentation.certifyingOrganization)],
  ]));

  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // Customer & Document subsection
  children.push(createSubsectionTitle('Customer & Document'));
  children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

  children.push(createKeyValueTable([
    ['Customer Name', formatValue(documentation.customerName)],
    ['Purchase Order', formatValue(documentation.purchaseOrder)],
    ['Part Serial Number', formatValue(documentation.serialNumber)],
    ['Inspection Date', formatDate(documentation.inspectionDate)],
    ['Procedure Number', formatValue(documentation.procedureNumber)],
    ['Drawing Reference', formatValue(documentation.drawingReference)],
    ['Revision', formatValue(documentation.revision)],
  ]));

  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // Additional Notes
  if (documentation.additionalNotes) {
    children.push(createSubsectionTitle('Additional Notes'));
    children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
    children.push(new Paragraph({
      children: [new TextRun({ text: documentation.additionalNotes, size: 18 })],
      spacing: { after: 200 },
    }));
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ========== 7. CALIBRATION / REFERENCE STANDARD ==========
  children.push(createSectionTitle('7. CALIBRATION / REFERENCE STANDARD'));
  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  children.push(createKeyValueTable([
    ['Standard/Block Type', formatBlockType(calibration.standardType)],
    ['Reference Material', formatValue(calibration.referenceMaterial)],
    ['Block Dimensions', formatValue(calibration.blockDimensions)],
    ['Block Serial Number', formatValue(calibration.blockSerialNumber)],
    ['Last Calibration Date', formatDate(calibration.lastCalibrationDate)],
    ['Metal Travel Distance', calibration.metalTravelDistance ? formatNumber(calibration.metalTravelDistance, 1, 'mm') : '-'],
  ], 'Calibration'));

  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // FBH Table
  if (calibration.fbhHoles && calibration.fbhHoles.length > 0) {
    children.push(createSubsectionTitle('Flat Bottom Holes (FBH)'));
    children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

    const fbhHeaders = ['P/N', 'Delta Type', 'FBH (inch)', 'FBH (mm)', 'E (mm)', 'H (mm)'];
    const fbhHeaderRow = new TableRow({
      children: fbhHeaders.map(text => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text, bold: true, size: 16, color: 'FFFFFF' })],
          alignment: AlignmentType.CENTER,
        })],
        shading: { fill: WORD_COLORS.primary, type: ShadingType.CLEAR },
        margins: {
          top: convertInchesToTwip(0.04),
          bottom: convertInchesToTwip(0.04),
          left: convertInchesToTwip(0.04),
          right: convertInchesToTwip(0.04),
        },
      })),
    });

    const fbhDataRows = calibration.fbhHoles.map((hole, idx) => new TableRow({
      children: [
        hole.partNumber || '-',
        hole.deltaType || '-',
        hole.diameterInch || '-',
        formatNumber(hole.diameterMm, 2, 'mm'),
        formatNumber(hole.blockHeightE, 1, 'mm'),
        formatNumber(hole.metalTravelH, 1, 'mm'),
      ].map(text => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text, size: 16 })],
          alignment: AlignmentType.CENTER,
        })],
        shading: idx % 2 === 1 ? { fill: WORD_COLORS.rowAlt, type: ShadingType.CLEAR } : undefined,
        margins: {
          top: convertInchesToTwip(0.04),
          bottom: convertInchesToTwip(0.04),
          left: convertInchesToTwip(0.04),
          right: convertInchesToTwip(0.04),
        },
      })),
    }));

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [fbhHeaderRow, ...fbhDataRows],
    }));

    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  } else if (calibration.fbhSizes) {
    children.push(createSubsectionTitle('FBH Sizes'));
    children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
    children.push(new Paragraph({
      children: [new TextRun({ text: formatValue(calibration.fbhSizes), size: 18 })],
      spacing: { after: 200 },
    }));
  }

  // Calibration Block Diagram
  if (data.calibrationBlockDiagram) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(...createImageSection(
      'CALIBRATION BLOCK DIAGRAM',
      'Reference block geometry used for sensitivity setup and verification.',
      data.calibrationBlockDiagram,
      560,
      360,
      'Calibration block diagram could not be loaded.'
    ));
  }

  // Angle Beam Diagram
  if (data.angleBeamDiagram) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(...createImageSection(
      'ANGLE BEAM CALIBRATION BLOCK',
      'Shear wave and circumferential inspection reference block.',
      data.angleBeamDiagram,
      560,
      390,
      'Angle beam calibration block diagram could not be loaded.'
    ));
  }

  // Technical Drawing (full page)
  if (data.capturedDrawing) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(...createImageSection(
      'TECHNICAL DRAWING',
      'Captured technical drawing view exported from the application canvas.',
      data.capturedDrawing,
      580,
      430,
      'Technical drawing could not be loaded.'
    ));
  }

  // E2375 Diagram
  if (data.e2375Diagram) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(...createImageSection(
      'ASTM E2375 SCAN DIRECTIONS DIAGRAM',
      `Standard practice reference for ${formatPartType(inspectionSetup.partType)} geometry.`,
      data.e2375Diagram,
      580,
      430,
      'E2375 scan directions diagram could not be loaded.'
    ));
    children.push(new Paragraph({
      children: [new TextRun({
        text: 'Reference: ASTM E2375 "Standard Practice for Ultrasonic Testing of Wrought Products"',
        size: 14,
        color: WORD_COLORS.lightText,
        italics: true,
      })],
      spacing: { before: 60, after: 120 },
    }));
  }

  // Scan Directions Drawing
  if (data.scanDirectionsDrawing) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(...createImageSection(
      'SCAN DIRECTIONS - INSPECTION PLAN',
      'Inspection plan showing selected scan directions, entry surfaces, and beam paths.',
      data.scanDirectionsDrawing,
      580,
      430,
      'Scan directions drawing could not be loaded.'
    ));
  }

  // ========== 8. APPROVALS & SIGNATURES ==========
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(...buildApprovalsSection(documentation as ExtendedDocumentationData, documentation.approvalRequired));

  // ========== CREATE DOCUMENT ==========
  const document = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 21,
          },
          paragraph: {
            spacing: { line: 276 },
          },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.7),
            bottom: convertInchesToTwip(0.65),
            left: convertInchesToTwip(0.7),
            right: convertInchesToTwip(0.7),
          },
          size: {
            width: convertInchesToTwip(8.27),
            height: convertInchesToTwip(11.69),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.SINGLE, size: 12, color: WORD_COLORS.primary },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                      },
                      children: [new Paragraph({
                        children: [
                          new TextRun({ text: 'UT TECHNIQUE SHEET', bold: true, size: 17, color: WORD_COLORS.primaryDark }),
                        ],
                      })],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                      },
                      children: [new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: `Doc: ${docNum}`, size: 16, color: WORD_COLORS.lightText }),
                          new TextRun({ text: `  |  Rev: ${revision}`, size: 16, color: WORD_COLORS.lightText }),
                        ],
                      })],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: WORD_COLORS.divider },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                      },
                      children: [new Paragraph({
                        children: [
                          new TextRun({ text: `P/N: ${inspectionSetup.partNumber || '-'}`, size: 14, color: WORD_COLORS.lightText }),
                        ],
                      })],
                      width: { size: 33, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                      },
                      children: [new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({ text: 'CONTROLLED DOCUMENT', size: 12, color: WORD_COLORS.mutedText }),
                        ],
                      })],
                      width: { size: 34, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                      },
                      children: [new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: 'Page ', size: 14, color: WORD_COLORS.lightText }),
                          new TextRun({
                            children: [PageNumber.CURRENT],
                            size: 14,
                            color: WORD_COLORS.primary,
                            bold: true,
                          }),
                          new TextRun({ text: ' of ', size: 14, color: WORD_COLORS.lightText }),
                          new TextRun({
                            children: [PageNumber.TOTAL_PAGES],
                            size: 14,
                            color: WORD_COLORS.primary,
                            bold: true,
                          }),
                        ],
                      })],
                      width: { size: 33, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      },
      children,
    }],
  });

  return {
    document,
    filename: getTechniqueSheetWordFilename(inspectionSetup.partNumber),
  };
}

export async function exportTechniqueSheetWord(
  data: TechniqueSheetWordExportData,
  options: WordExportOptions = {}
): Promise<void> {
  const { document, filename } = buildTechniqueSheetWordDocument(data, options);
  const blob = await Packer.toBlob(document);

  const fileSaverModule = await import('file-saver');
  const saveAsFn =
    (fileSaverModule as any).saveAs ??
    (fileSaverModule as any).default?.saveAs ??
    (fileSaverModule as any).default;

  if (typeof saveAsFn !== 'function') {
    throw new Error('file-saver saveAs function is unavailable');
  }

  saveAsFn(blob, filename);
}

export default exportTechniqueSheetWord;

