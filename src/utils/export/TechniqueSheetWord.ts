/**
 * TechniqueSheetWord - Professional Word Export for Technique Sheets
 *
 * Creates professional DOCX documents using the docx library.
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

  // Part Information
  children.push(...createSection('1. PART INFORMATION', [
    ['Part Number', formatValue(inspectionSetup.partNumber)],
    ['Part Name', formatValue(inspectionSetup.partName)],
    ['Material', formatValue(inspectionSetup.material)],
    ['Material Specification', formatValue(inspectionSetup.materialSpec)],
    ['Part Type', formatValue(inspectionSetup.partType)],
    ['Drawing Number', formatValue(inspectionSetup.drawingNumber)],
  ]));

  // Equipment
  children.push(...createSection('2. EQUIPMENT', [
    ['Manufacturer', formatValue(equipment.manufacturer)],
    ['Model', formatValue(equipment.model)],
    ['Serial Number', formatValue(equipment.serialNumber)],
    ['Frequency', equipment.frequency ? `${equipment.frequency} MHz` : '-'],
    ['Transducer Type', formatValue(equipment.transducerType)],
    ['Couplant', formatValue(equipment.couplant)],
  ]));

  // Calibration
  children.push(...createSection('3. CALIBRATION', [
    ['Standard/Block Type', formatValue(calibration.standardType)],
    ['Reference Material', formatValue(calibration.referenceMaterial)],
    ['Block Serial Number', formatValue(calibration.blockSerialNumber)],
    ['Last Calibration Date', formatDate(calibration.lastCalibrationDate)],
  ]));

  // Scan Parameters
  children.push(...createSection('4. SCAN PARAMETERS', [
    ['Scan Method', formatValue(scanParameters.scanMethod)],
    ['Scan Type', formatValue(scanParameters.scanType)],
    ['Technique', formatValue(scanParameters.technique)],
    ['Scan Speed', scanParameters.scanSpeed ? `${scanParameters.scanSpeed} mm/s` : '-'],
    ['Coverage', scanParameters.coverage ? `${scanParameters.coverage}%` : '-'],
  ]));

  // Acceptance Criteria
  children.push(...createSection('5. ACCEPTANCE CRITERIA', [
    ['Acceptance Class', formatValue(acceptanceCriteria.acceptanceClass)],
    ['Single Discontinuity', formatValue(acceptanceCriteria.singleDiscontinuity)],
    ['Multiple Discontinuities', formatValue(acceptanceCriteria.multipleDiscontinuities)],
  ]));

  // Scan Details (if available)
  if (scanDetails?.scanDetails && scanDetails.scanDetails.some(d => d.enabled)) {
    children.push(new Paragraph({
      children: [new TextRun({ text: '6. SCAN DETAILS', bold: true, size: 26 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    }));

    const headerRow = new TableRow({
      children: ['Dir.', 'Wave Mode', 'Freq.', 'Technique', 'Active El.', 'Probe', 'Remarks'].map(text => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18, color: 'FFFFFF' })] })],
        shading: { fill: '1e3a5f', type: ShadingType.SOLID, color: 'FFFFFF' },
      })),
    });

    const dataRows = scanDetails.scanDetails
      .filter(d => d.enabled)
      .map(detail => new TableRow({
        children: [
          detail.scanningDirection,
          detail.waveMode || '-',
          detail.frequency ? `${detail.frequency}` : '-',
          detail.technique || '-',
          detail.activeElement || '-',
          detail.probe || '-',
          detail.remarkDetails || '-',
        ].map(text => new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, size: 18 })] })],
        })),
      }));

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    }));
  }

  // Documentation
  children.push(...createSection('7. DOCUMENTATION', [
    ['Inspector Name', formatValue(documentation.inspectorName)],
    ['Inspector Level', formatValue(documentation.inspectorLevel)],
    ['Certification', formatValue(documentation.inspectorCertification)],
    ['Inspection Date', formatDate(documentation.inspectionDate)],
    ['Procedure Number', formatValue(documentation.procedureNumber)],
  ]));

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
