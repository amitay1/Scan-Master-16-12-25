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
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  ShadingType,
  convertInchesToTwip,
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
