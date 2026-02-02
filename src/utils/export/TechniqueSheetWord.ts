// @ts-nocheck
/**
 * TechniqueSheetWord - Professional Word Export for Technique Sheets
 *
 * Creates professional DOCX documents using the docx library.
 * SYNCHRONIZED WITH TechniqueSheetPDF.ts - Both exports must have identical content and styling.
 *
 * Design matches PDF: FRISA/TÜV professional style with:
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
// COLORS - Matching PDF TUV-style blue theme (hex values for docx)
// ============================================================================
const WORD_COLORS = {
  primary: '005293',         // TUV blue - headers
  primaryDark: '003C6E',     // Darker blue
  secondary: '4080B2',       // Medium blue - subheaders
  accent: '007AC2',          // Light blue - highlights
  accentGold: 'D4AF37',      // Gold accent

  // Background colors
  headerBg: 'F0F5FA',        // Light gray-blue
  sectionBg: 'F5F7FA',       // Section backgrounds
  rowAlt: 'F8FAFC',          // Alternating row
  labelBg: 'E6EBF0',         // Label cell background
  white: 'FFFFFF',

  // Border colors
  tableBorder: 'C8D2DC',
  divider: 'DCE1E6',

  // Text colors
  text: '1E1E1E',
  lightText: '646464',
  mutedText: '828282',
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
  // Main header table with blue background
  const headerCells: TableCell[] = [];

  // LOGO CELL (if logo provided) - Far left with white background
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
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.SINGLE, size: 8, color: WORD_COLORS.accentGold },
          },
          width: { size: 15, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          margins: {
            top: convertInchesToTwip(0.05),
            bottom: convertInchesToTwip(0.05),
            left: convertInchesToTwip(0.1),
            right: convertInchesToTwip(0.1),
          },
        })
      );
    } catch {
      // If logo fails to load, skip it
    }
  }

  // Title and company name section
  const leftContent: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: 'UT TECHNIQUE SHEET',
          bold: true,
          size: 28, // 14pt
          color: 'FFFFFF',
        }),
      ],
      spacing: { after: 60 },
    }),
  ];

  if (companyName) {
    leftContent.push(
      new Paragraph({
        children: [
          new TextRun({
            text: companyName,
            size: 18, // 9pt
            color: 'C8DCF0', // Light blue-gray
          }),
        ],
      })
    );
  }

  // Calculate width based on whether logo is present
  const titleWidth = companyLogo ? 40 : 55;

  headerCells.push(
    new TableCell({
      children: leftContent,
      shading: { fill: WORD_COLORS.primary, type: ShadingType.CLEAR },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      width: { size: titleWidth, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.CENTER,
      margins: {
        left: convertInchesToTwip(0.15),
      },
    })
  );

  // Right side: Document info box (white background)
  const infoBoxContent: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: 'Document No:', size: 14, color: WORD_COLORS.lightText }),
        new TextRun({ text: '  ', size: 14 }),
        new TextRun({ text: docNum, bold: true, size: 16, color: WORD_COLORS.primaryDark }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Revision:', size: 14, color: WORD_COLORS.lightText }),
        new TextRun({ text: '  ', size: 14 }),
        new TextRun({ text: revision, bold: true, size: 16, color: WORD_COLORS.primaryDark }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Date:', size: 14, color: WORD_COLORS.lightText }),
        new TextRun({ text: '  ', size: 14 }),
        new TextRun({ text: dateStr, bold: true, size: 16, color: WORD_COLORS.primaryDark }),
      ],
    }),
  ];

  headerCells.push(
    new TableCell({
      children: [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: infoBoxContent,
                  shading: { fill: WORD_COLORS.white, type: ShadingType.CLEAR },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
                    left: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
                    right: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
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
        }),
      ],
      shading: { fill: WORD_COLORS.primary, type: ShadingType.CLEAR },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
      width: { size: 45, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.CENTER,
      margins: {
        top: convertInchesToTwip(0.1),
        bottom: convertInchesToTwip(0.1),
        left: convertInchesToTwip(0.1),
        right: convertInchesToTwip(0.15),
      },
    })
  );

  // Calculate column span for gold line based on number of header cells
  const goldLineColumnSpan = headerCells.length;

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: headerCells,
        height: { value: convertInchesToTwip(0.9), rule: 'atLeast' as const },
      }),
      // Gold accent line
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [] })],
            shading: { fill: WORD_COLORS.accentGold, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            columnSpan: goldLineColumnSpan,
          }),
        ],
        height: { value: convertInchesToTwip(0.04), rule: 'exact' as const },
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
          // Gold left accent bar
          new TableCell({
            children: [new Paragraph({ children: [] })],
            shading: { fill: WORD_COLORS.accentGold, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            width: { size: 2, type: WidthType.PERCENTAGE },
          }),
          // Blue main bar with title
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 24, // 12pt
                    color: 'FFFFFF',
                  }),
                ],
                alignment: AlignmentType.LEFT,
              }),
            ],
            shading: { fill: WORD_COLORS.primary, type: ShadingType.CLEAR },
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
// SUBSECTION TITLE (matching PDF addSubsectionTitle)
// ============================================================================
const createSubsectionTitle = (title: string): Table => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          // Blue accent bar
          new TableCell({
            children: [new Paragraph({ children: [] })],
            shading: { fill: WORD_COLORS.primary, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            width: { size: 1, type: WidthType.PERCENTAGE },
          }),
          // Gold accent bar
          new TableCell({
            children: [new Paragraph({ children: [] })],
            shading: { fill: WORD_COLORS.accentGold, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            width: { size: 1, type: WidthType.PERCENTAGE },
          }),
          // Light background with title
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 20, // 10pt
                    color: WORD_COLORS.primary,
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
              top: convertInchesToTwip(0.06),
              bottom: convertInchesToTwip(0.06),
              left: convertInchesToTwip(0.1),
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
                  size: isAcceptanceClass ? 22 : (isLabel ? 15 : 18),
                  color: isLabel ? WORD_COLORS.lightText : (isAcceptanceClass ? WORD_COLORS.primary : WORD_COLORS.text),
                }),
              ],
            }),
          ],
          shading: isLabel ? { fill: WORD_COLORS.labelBg, type: ShadingType.CLEAR } : (rowIndex % 2 === 0 ? { fill: WORD_COLORS.rowAlt, type: ShadingType.CLEAR } : undefined),
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
            left: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
            right: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
          },
          width: { size: isLabel ? 18 : 32, type: WidthType.PERCENTAGE },
          margins: {
            top: convertInchesToTwip(0.04),
            bottom: convertInchesToTwip(0.04),
            left: convertInchesToTwip(0.06),
            right: convertInchesToTwip(0.06),
          },
        });
      }),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: WORD_COLORS.primary },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: WORD_COLORS.primary },
      left: { style: BorderStyle.SINGLE, size: 8, color: WORD_COLORS.primary },
      right: { style: BorderStyle.SINGLE, size: 8, color: WORD_COLORS.primary },
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
                    size: 18,
                    color: 'FFFFFF',
                  }),
                ],
              }),
            ],
            shading: { fill: headerColor || WORD_COLORS.primary, type: ShadingType.CLEAR },
            width: { size: 35, type: WidthType.PERCENTAGE },
            margins: {
              top: convertInchesToTwip(0.04),
              bottom: convertInchesToTwip(0.04),
              left: convertInchesToTwip(0.08),
              right: convertInchesToTwip(0.08),
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Value',
                    bold: true,
                    size: 18,
                    color: 'FFFFFF',
                  }),
                ],
              }),
            ],
            shading: { fill: headerColor || WORD_COLORS.primary, type: ShadingType.CLEAR },
            width: { size: 65, type: WidthType.PERCENTAGE },
            margins: {
              top: convertInchesToTwip(0.04),
              bottom: convertInchesToTwip(0.04),
              left: convertInchesToTwip(0.08),
              right: convertInchesToTwip(0.08),
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
                    size: 18,
                    color: WORD_COLORS.text,
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
            width: { size: 35, type: WidthType.PERCENTAGE },
            margins: {
              top: convertInchesToTwip(0.04),
              bottom: convertInchesToTwip(0.04),
              left: convertInchesToTwip(0.08),
              right: convertInchesToTwip(0.08),
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
            shading: index % 2 === 1 ? { fill: WORD_COLORS.rowAlt, type: ShadingType.CLEAR } : undefined,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
              left: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
              right: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
            },
            width: { size: 65, type: WidthType.PERCENTAGE },
            margins: {
              top: convertInchesToTwip(0.04),
              bottom: convertInchesToTwip(0.04),
              left: convertInchesToTwip(0.08),
              right: convertInchesToTwip(0.08),
            },
          }),
        ],
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
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
                    text: `⚠️ ${text}`,
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
    elements.push(createWarningBox('NOTICE: This technique sheet requires Level III approval before use in production.'));
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
export async function exportTechniqueSheetWord(
  data: TechniqueSheetWordExportData,
  options: WordExportOptions = {}
): Promise<void> {
  const { inspectionSetup, equipment, calibration, scanParameters, acceptanceCriteria, documentation, scanDetails } = data;

  const children: (Paragraph | Table)[] = [];

  // Document info
  const docNum = documentation.procedureNumber || `TS-${inspectionSetup.partNumber || 'XXX'}`;
  const revision = documentation.revision || 'A';
  const dateStr = formatDate(documentation.inspectionDate);

  // ========== COVER PAGE ==========
  // Header bar with document info
  children.push(createCoverHeader(docNum, revision, dateStr, options.companyName, options.companyLogo));
  children.push(new Paragraph({ children: [], spacing: { after: 300 } }));

  // Document Summary section header
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [] })],
            shading: { fill: WORD_COLORS.primary, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
            width: { size: 2, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'DOCUMENT SUMMARY',
                    bold: true,
                    size: 22,
                    color: WORD_COLORS.primary,
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
  }));
  children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

  // Document Summary table
  children.push(createDocumentSummaryTable(data, data.standard));
  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // Part Sketch section
  children.push(createPartSketchSectionHeader());
  children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

  // Part sketch area (with drawing or placeholder)
  if (data.capturedDrawing) {
    try {
      const imageBuffer = base64ToArrayBuffer(data.capturedDrawing);
      children.push(new Table({
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
                        transformation: { width: 500, height: 280 },
                      }),
                    ],
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
                  left: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
                  right: { style: BorderStyle.SINGLE, size: 4, color: WORD_COLORS.tableBorder },
                },
                margins: {
                  top: convertInchesToTwip(0.1),
                  bottom: convertInchesToTwip(0.1),
                  left: convertInchesToTwip(0.1),
                  right: convertInchesToTwip(0.1),
                },
              }),
            ],
          }),
        ],
      }));
    } catch {
      // Placeholder if image fails
      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Part sketch will be generated from Technical Drawing tab',
                        italics: true,
                        size: 20,
                        color: WORD_COLORS.lightText,
                      }),
                    ],
                    spacing: { before: 400, after: 100 },
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Or attach custom drawing in Setup',
                        size: 16,
                        color: WORD_COLORS.mutedText,
                      }),
                    ],
                    spacing: { after: 400 },
                  }),
                ],
                borders: {
                  top: { style: BorderStyle.DASHED, size: 4, color: WORD_COLORS.divider },
                  bottom: { style: BorderStyle.DASHED, size: 4, color: WORD_COLORS.divider },
                  left: { style: BorderStyle.DASHED, size: 4, color: WORD_COLORS.divider },
                  right: { style: BorderStyle.DASHED, size: 4, color: WORD_COLORS.divider },
                },
              }),
            ],
            height: { value: convertInchesToTwip(2.5), rule: 'atLeast' as const },
          }),
        ],
      }));
    }
  } else {
    // Placeholder
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'Part sketch will be generated from Technical Drawing tab',
                      italics: true,
                      size: 20,
                      color: WORD_COLORS.lightText,
                    }),
                  ],
                  spacing: { before: 400, after: 100 },
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'Or attach custom drawing in Setup',
                      size: 16,
                      color: WORD_COLORS.mutedText,
                    }),
                  ],
                  spacing: { after: 400 },
                }),
              ],
              borders: {
                top: { style: BorderStyle.DASHED, size: 4, color: WORD_COLORS.divider },
                bottom: { style: BorderStyle.DASHED, size: 4, color: WORD_COLORS.divider },
                left: { style: BorderStyle.DASHED, size: 4, color: WORD_COLORS.divider },
                right: { style: BorderStyle.DASHED, size: 4, color: WORD_COLORS.divider },
              },
            }),
          ],
          height: { value: convertInchesToTwip(2.5), rule: 'atLeast' as const },
        }),
      ],
    }));
  }

  children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

  // Key Dimensions line
  const keyDimsLine = createKeyDimensionsLine(inspectionSetup);
  if (keyDimsLine) {
    children.push(keyDimsLine);
  }

  // Page break after cover
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ========== TABLE OF CONTENTS ==========
  children.push(...buildTableOfContents(
    !!data.capturedDrawing,
    !!scanDetails?.scanDetails?.some(d => d.enabled),
    !!data.angleBeamDiagram
  ));

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

  // Material Properties subsection
  if (inspectionSetup.acousticVelocity || inspectionSetup.materialDensity) {
    const matProps: [string, string][] = [];
    if (inspectionSetup.acousticVelocity) {
      matProps.push(['Acoustic Velocity', formatNumber(inspectionSetup.acousticVelocity, 0, 'm/s')]);
    }
    if (inspectionSetup.materialDensity) {
      matProps.push(['Material Density', formatNumber(inspectionSetup.materialDensity, 0, 'kg/m³')]);
    }
    if (matProps.length > 0) {
      children.push(createSubsectionTitle('Material Properties'));
      children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
      children.push(createKeyValueTable(matProps));
      children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    }
  }

  // Material Warning
  const materialWarning = getMaterialWarning(inspectionSetup.material);
  if (materialWarning) {
    children.push(createWarningBox(materialWarning));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

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

  // Transducer subsection
  children.push(createSubsectionTitle('Transducer'));
  children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

  children.push(createKeyValueTable([
    ['Probe Model', formatValue(equipment.probeModel)],
    ['Frequency', equipment.frequency ? `${equipment.frequency} MHz` : '-'],
    ['Type', formatTransducerType(equipment.transducerType)],
    ['Element Diameter', equipment.transducerDiameter ? formatNumber(equipment.transducerDiameter, 3, 'inches') : '-'],
    ['Couplant', formatValue(equipment.couplant)],
  ], undefined, WORD_COLORS.secondary));

  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // Performance Parameters
  children.push(createSubsectionTitle('Performance Parameters'));
  children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

  children.push(createKeyValueTable([
    ['Vertical Linearity', equipment.verticalLinearity ? `${equipment.verticalLinearity}%` : '-'],
    ['Horizontal Linearity', equipment.horizontalLinearity ? `${equipment.horizontalLinearity}%` : '-'],
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

  children.push(new Paragraph({ children: [new PageBreak()] }));

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
    ['Gain Settings', formatValue(scanParameters.gainSettings)],
    ['Alarm Gate Settings', formatValue(scanParameters.alarmGateSettings)],
  ]));

  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

  // Phased Array Settings (if applicable)
  if (scanParameters.couplingMethod === 'phased_array' && scanParameters.phasedArray) {
    const pa = scanParameters.phasedArray;
    const paSettings: [string, string][] = [];
    if (pa.refractedAngleStart) paSettings.push(['Refracted Angle Start', `${pa.refractedAngleStart}°`]);
    if (pa.refractedAngleEnd) paSettings.push(['Refracted Angle End', `${pa.refractedAngleEnd}°`]);
    if (pa.aperture) paSettings.push(['Aperture', String(pa.aperture)]);
    if (pa.focusLaws) paSettings.push(['Focus Laws', formatValue(pa.focusLaws)]);

    if (paSettings.length > 0) {
      children.push(createSubsectionTitle('Phased Array Settings'));
      children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
      children.push(createKeyValueTable(paSettings, undefined, '800080')); // Purple
      children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
    }
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

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

  // Material Warning in Acceptance section
  if (materialWarning) {
    children.push(createWarningBox(`MATERIAL WARNING: ${materialWarning}`));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ========== 5. SCAN DETAILS (if available) ==========
  if (scanDetails?.scanDetails && scanDetails.scanDetails.some(d => d.enabled)) {
    children.push(createSectionTitle('5. SCAN DETAILS & DIRECTIONS'));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

    const enabledDetails = scanDetails.scanDetails.filter(d => d.enabled);

    // Scan Directions Overview
    children.push(createSubsectionTitle('Scan Directions Overview'));
    children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

    const overviewHeaders = ['Dir.', 'Wave Mode', 'Angle', 'Freq.', 'Make', 'Probe/Size', 'Remarks'];
    const overviewHeaderRow = new TableRow({
      children: overviewHeaders.map(text => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text, bold: true, size: 14, color: 'FFFFFF' })],
          alignment: AlignmentType.CENTER,
        })],
        shading: { fill: WORD_COLORS.primaryDark, type: ShadingType.CLEAR },
        margins: {
          top: convertInchesToTwip(0.03),
          bottom: convertInchesToTwip(0.03),
          left: convertInchesToTwip(0.03),
          right: convertInchesToTwip(0.03),
        },
      })),
    });

    const overviewDataRows = enabledDetails.map((detail, idx) => new TableRow({
      children: [
        detail.scanningDirection,
        detail.waveMode || '-',
        detail.angle !== undefined ? `${detail.angle}°` : '-',
        detail.frequency ? `${detail.frequency} MHz` : '-',
        detail.make || '-',
        detail.probe || '-',
        detail.remarkDetails || '-',
      ].map(text => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text, size: 14 })],
        })],
        shading: idx % 2 === 1 ? { fill: WORD_COLORS.rowAlt, type: ShadingType.CLEAR } : undefined,
        margins: {
          top: convertInchesToTwip(0.03),
          bottom: convertInchesToTwip(0.03),
          left: convertInchesToTwip(0.03),
          right: convertInchesToTwip(0.03),
        },
      })),
    }));

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [overviewHeaderRow, ...overviewDataRows],
    }));

    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

    // Probe Details
    children.push(createSubsectionTitle('Probe Details'));
    children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

    const probeHeaders = ['Dir.', 'Part Number', 'Serial Number', 'Range', 'Attenuation', 'BWE', 'SSS'];
    const probeHeaderRow = new TableRow({
      children: probeHeaders.map(text => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text, bold: true, size: 14, color: 'FFFFFF' })],
          alignment: AlignmentType.CENTER,
        })],
        shading: { fill: '2563EB', type: ShadingType.CLEAR },
        margins: {
          top: convertInchesToTwip(0.03),
          bottom: convertInchesToTwip(0.03),
          left: convertInchesToTwip(0.03),
          right: convertInchesToTwip(0.03),
        },
      })),
    });

    const probeDataRows = enabledDetails.map((detail, idx) => new TableRow({
      children: [
        detail.scanningDirection,
        detail.partNumber || '-',
        detail.serialNumber || '-',
        detail.rangeMm !== undefined ? `${detail.rangeMm} mm` : '-',
        detail.attenuation !== undefined ? `${detail.attenuation} dB` : '-',
        detail.backWallEcho !== undefined ? `${detail.backWallEcho}%` : '-',
        detail.sss || '-',
      ].map(text => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text, size: 14 })],
        })],
        shading: idx % 2 === 1 ? { fill: WORD_COLORS.rowAlt, type: ShadingType.CLEAR } : undefined,
        margins: {
          top: convertInchesToTwip(0.03),
          bottom: convertInchesToTwip(0.03),
          left: convertInchesToTwip(0.03),
          right: convertInchesToTwip(0.03),
        },
      })),
    }));

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [probeHeaderRow, ...probeDataRows],
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

    const fbhHeaders = ['P/N', 'Δ Type', 'Ø FBH (inch)', 'Ø FBH (mm)', 'E (mm)', 'H (mm)'];
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
    children.push(createSubsectionTitle('Calibration Block Diagram'));
    children.push(new Paragraph({ children: [], spacing: { after: 100 } }));

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
    } catch {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Calibration block diagram could not be loaded.', italics: true, color: WORD_COLORS.lightText })],
      }));
    }

    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  }

  // Angle Beam Diagram
  if (data.angleBeamDiagram) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(createSubsectionTitle('Angle Beam Calibration Block'));
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Shear Wave / Circumferential Inspection Reference Block', size: 16, color: WORD_COLORS.lightText })],
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
    } catch {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Angle beam calibration block diagram could not be loaded.', italics: true, color: WORD_COLORS.lightText })],
      }));
    }

    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  }

  // Technical Drawing (full page)
  if (data.capturedDrawing) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(createSectionTitle('TECHNICAL DRAWING'));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

    try {
      const imageBuffer = base64ToArrayBuffer(data.capturedDrawing);
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: 'png',
            data: imageBuffer,
            transformation: { width: 550, height: 400 },
          }),
        ],
      }));
    } catch {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Technical drawing could not be loaded.', italics: true, color: WORD_COLORS.lightText })],
      }));
    }

    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  }

  // E2375 Diagram
  if (data.e2375Diagram) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(createSectionTitle('ASTM E2375 SCAN DIRECTIONS DIAGRAM'));
    children.push(new Paragraph({
      children: [new TextRun({
        text: `Standard Practice for Ultrasonic Testing of Wrought Products - ${formatPartType(inspectionSetup.partType)}`,
        size: 16,
        color: WORD_COLORS.lightText,
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
            transformation: { width: 550, height: 400 },
          }),
        ],
      }));
      children.push(new Paragraph({
        children: [new TextRun({
          text: 'Reference: ASTM E2375-16 "Standard Practice for Ultrasonic Testing of Wrought Products"',
          size: 14,
          color: WORD_COLORS.lightText,
          italics: true,
        })],
        spacing: { before: 100 },
      }));
    } catch {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'E2375 scan directions diagram could not be loaded.', italics: true, color: WORD_COLORS.lightText })],
      }));
    }

    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  }

  // Scan Directions Drawing
  if (data.scanDirectionsDrawing) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(createSectionTitle('SCAN DIRECTIONS - INSPECTION PLAN'));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));

    try {
      const imageBuffer = base64ToArrayBuffer(data.scanDirectionsDrawing);
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: 'png',
            data: imageBuffer,
            transformation: { width: 550, height: 400 },
          }),
        ],
      }));
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: 'Figure: Inspection plan showing selected scanning directions with entry surfaces and beam paths.',
          size: 16,
          color: WORD_COLORS.lightText,
          italics: true,
        })],
        spacing: { before: 100 },
      }));
    } catch {
      children.push(new Paragraph({
        children: [new TextRun({ text: 'Scan directions drawing could not be loaded.', italics: true, color: WORD_COLORS.lightText })],
      }));
    }

    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  }

  // ========== 8. APPROVALS & SIGNATURES ==========
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(...buildApprovalsSection(documentation as ExtendedDocumentationData, documentation.approvalRequired));

  // ========== CREATE DOCUMENT ==========
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 20,
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
            top: convertInchesToTwip(0.6),
            bottom: convertInchesToTwip(0.6),
            left: convertInchesToTwip(0.6),
            right: convertInchesToTwip(0.6),
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
                          new TextRun({ text: 'UT TECHNIQUE SHEET', bold: true, size: 18, color: WORD_COLORS.primary }),
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
                top: { style: BorderStyle.SINGLE, size: 6, color: WORD_COLORS.accentGold },
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
                          new TextRun({ text: 'CONFIDENTIAL', size: 12, color: WORD_COLORS.mutedText }),
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

  // Generate filename
  const partNumber = inspectionSetup.partNumber || 'TechniqueSheet';
  const date = new Date().toISOString().split('T')[0];
  const filename = `${partNumber}_TechniqueSheet_${date}.docx`;

  // Export
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

export default exportTechniqueSheetWord;
