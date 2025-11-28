import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  StandardType,
  InspectionSetupData,
  EquipmentData,
  CalibrationData,
  ScanParametersData,
  AcceptanceCriteriaData,
  DocumentationData,
  CalibrationBlockType,
  PartGeometry,
} from '@/types/techniqueSheet';
import {
  drawProfessionalCalibrationBlock,
  drawProfessionalPartWithScanDirections,
} from './drawings/professionalDrawings';

interface ComprehensiveTechniqueSheetData {
  standard: StandardType;
  inspectionSetup: InspectionSetupData;
  equipment: EquipmentData;
  calibration: CalibrationData;
  scanParameters: ScanParametersData;
  acceptanceCriteria: AcceptanceCriteriaData;
  documentation: DocumentationData;
  partDiagram?: string; // Base64 image
  scanImages?: string[]; // Base64 images
}

/**
 * Parse FBH size string to diameter in mm
 * Handles formats: "3/64", "3/64\"", "5/64", "8/64", "1.19mm", etc.
 */
function parseFbhSize(sizeStr: string): number {
  // Remove quotes and mm suffix
  const cleaned = sizeStr.replace(/["'mm]/g, '').trim();
  
  // Try fractional format (e.g., "3/64")
  const fractionMatch = cleaned.match(/(\d+)\/(\d+)/);
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1], 10);
    const denominator = parseInt(fractionMatch[2], 10);
    // Convert from inches to mm (1 inch = 25.4 mm)
    return (numerator / denominator) * 25.4;
  }
  
  // Try decimal format
  const decimal = parseFloat(cleaned);
  if (!isNaN(decimal)) {
    return decimal;
  }
  
  // Default to 3/64" = 1.19mm
  return 1.19;
}

/**
 * Determine the appropriate calibration block type based on part geometry
 * This ensures the correct block is shown in the PDF even if not explicitly selected
 */
function getAppropriateBlockType(
  explicitBlockType: CalibrationBlockType | string | undefined,
  partType: PartGeometry | string | undefined,
  partThickness: number = 25
): CalibrationBlockType {
  // If explicitly set by user, use it (user selected the calibration block type)
  if (explicitBlockType && explicitBlockType !== '') {
    return explicitBlockType as CalibrationBlockType;
  }

  // Otherwise, recommend based on part geometry (fallback/auto-suggestion)
  const tubularGeometries = [
    'tube', 'pipe', 'ring', 'ring_forging', 'sleeve', 'bushing',
    'rectangular_tube', 'square_tube'
  ];
  
  const cylindricalGeometries = [
    'cylinder', 'round_bar', 'shaft', 'hub', 'disk', 'disk_forging'
  ];

  if (tubularGeometries.includes(partType as string)) {
    // For thin walls, use notched; for thick walls, use FBH
    return partThickness < 25 ? 'cylinder_notched' : 'cylinder_fbh';
  }
  
  if (cylindricalGeometries.includes(partType as string)) {
    return 'cylinder_fbh';
  }

  // Default to flat block for plates, bars, etc.
  return 'flat_block';
}

export function exportComprehensiveTechniqueSheet(data: ComprehensiveTechniqueSheetData): void {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // ============= TÜV PROFESSIONAL 19-PAGE EXPORT =============
  
  // ============= PAGE 1: COVER PAGE =============
  drawCoverPage(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGE 2: TABLE OF CONTENTS =============
  doc.addPage();
  drawTableOfContents(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGE 3: REVISION HISTORY =============
  doc.addPage();
  drawRevisionHistory(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGE 4: SCOPE & REFERENCES =============
  doc.addPage();
  drawScopeAndReferences(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGE 5-6: PART INFORMATION (2 pages) =============
  doc.addPage();
  drawPartInformationPage1(doc, data, pageWidth, pageHeight, margin);
  doc.addPage();
  drawPartInformationPage2(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGE 7-8: EQUIPMENT (2 pages) =============
  doc.addPage();
  drawEquipmentPage(doc, data, pageWidth, pageHeight, margin);
  doc.addPage();
  drawEquipmentPage2(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGE 9-10: CALIBRATION (2 pages) =============
  doc.addPage();
  drawCalibrationPage(doc, data, pageWidth, pageHeight, margin);
  doc.addPage();
  drawCalibrationPage2(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGE 11: REFERENCE STANDARDS (TÜV STYLE) =============
  doc.addPage();
  drawReferenceStandardsPage(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGE 12-13: INSPECTION PROCEDURES (2 pages) =============
  doc.addPage();
  drawInspectionProceduresPage1(doc, data, pageWidth, pageHeight, margin);
  doc.addPage();
  drawInspectionProceduresPage2(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGE 14-15: SCAN PLAN & COVERAGE (2 pages) =============
  doc.addPage();
  drawScanPlanPage(doc, data, pageWidth, pageHeight, margin);
  doc.addPage();
  drawCoverageMapPage(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGE 16: ACCEPTANCE CRITERIA =============
  doc.addPage();
  drawAcceptanceCriteriaPage(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGE 17-18: INSPECTION RESULTS (2 pages) =============
  doc.addPage();
  drawInspectionResultsPage1(doc, data, pageWidth, pageHeight, margin);
  doc.addPage();
  drawIndicationReportPage(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGE 19: APPROVAL & SIGNATURES =============
  doc.addPage();
  drawApprovalSignaturesPage(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGES 20+: SCAN IMAGES (if provided) =============
  if (data.scanImages && data.scanImages.length > 0) {
    data.scanImages.forEach((scanImage, index) => {
      doc.addPage();
      drawScanImagePage(doc, scanImage, index + 1, pageWidth, pageHeight, margin);
    });
  }

  // Add page numbers to all pages
  addPageNumbers(doc, pageWidth, pageHeight, data);

  // Save the PDF
  const filename = `UT_Technique_Sheet_${data.inspectionSetup.partNumber || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

function drawCoverPage(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin;

  // Header box with company info (top right)
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.rect(pageWidth - 70, yPos, 50, 35);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Document:', pageWidth - 68, yPos + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(data.documentation.procedureNumber || 'UT-TS-001', pageWidth - 68, yPos + 10);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Revision:', pageWidth - 68, yPos + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(data.documentation.revision || 'A', pageWidth - 68, yPos + 21);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', pageWidth - 68, yPos + 27);
  doc.setFont('helvetica', 'normal');
  doc.text(data.documentation.inspectionDate || new Date().toLocaleDateString(), pageWidth - 68, yPos + 32);

  // Main title
  yPos = 60;
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 8, pageWidth - 2 * margin, 15, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ULTRASONIC INSPECTION', pageWidth / 2, yPos, { align: 'center' });
  doc.setFontSize(14);
  doc.text('TECHNIQUE SHEET', pageWidth / 2, yPos + 8, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  yPos = 85;

  // Customer Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Information', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Field', 'Details']],
    body: [
      ['Customer Name', 'To be filled'],
      ['Address', 'To be filled'],
      ['Contact', 'To be filled'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Part Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Part Information', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: [
      ['Part Number', data.inspectionSetup.partNumber || 'N/A'],
      ['Part Name', data.inspectionSetup.partName || 'N/A'],
      ['Material', data.inspectionSetup.material || 'N/A'],
      ['Material Specification', data.inspectionSetup.materialSpec || 'N/A'],
      ['Type', data.inspectionSetup.partType || 'N/A'],
      ['Thickness (mm)', data.inspectionSetup.partThickness?.toString() || 'N/A'],
      ['Length × Width (mm)', `${data.inspectionSetup.partLength || 'N/A'} × ${data.inspectionSetup.partWidth || 'N/A'}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Inspection Specification
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Inspection Specification', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: [
      ['Standard', data.standard || 'N/A'],
      ['Inspection Type', 'Type 2 (Contact)'],
      ['Acceptance Class', data.acceptanceCriteria.acceptanceClass || 'N/A'],
      ['Inspection Extension', '100%'],
      ['Special Requirements', data.acceptanceCriteria.specialRequirements || 'None'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  // Approval Section at bottom
  yPos = pageHeight - 45;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  
  const colWidth = (pageWidth - 2 * margin - 10) / 3;
  
  // Prepared by
  doc.rect(margin, yPos, colWidth, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Prepared by:', margin + 2, yPos + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(data.documentation.inspectorName || 'N/A', margin + 2, yPos + 12);
  doc.text(`Level ${data.documentation.inspectorLevel || 'II'}`, margin + 2, yPos + 18);
  doc.text('Signature: _______________', margin + 2, yPos + 26);

  // Checked by
  doc.rect(margin + colWidth + 5, yPos, colWidth, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Checked by:', margin + colWidth + 7, yPos + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Level III', margin + colWidth + 7, yPos + 12);
  doc.text('Signature: _______________', margin + colWidth + 7, yPos + 26);

  // Approved by
  doc.rect(margin + 2 * colWidth + 10, yPos, colWidth, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Approved by:', margin + 2 * colWidth + 12, yPos + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(data.documentation.certifyingOrganization || 'N/A', margin + 2 * colWidth + 12, yPos + 12);
  doc.text('Date: _______________', margin + 2 * colWidth + 12, yPos + 26);
}

// ============= PAGE 2: TABLE OF CONTENTS =============
function drawTableOfContents(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TABLE OF CONTENTS', pageWidth / 2, yPos + 3, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // Table of contents entries
  const tocEntries = [
    { section: '1.0', title: 'Cover Page', page: 1 },
    { section: '2.0', title: 'Table of Contents', page: 2 },
    { section: '3.0', title: 'Revision History', page: 3 },
    { section: '4.0', title: 'Scope and References', page: 4 },
    { section: '5.0', title: 'Part Information', page: '5-6' },
    { section: '6.0', title: 'Equipment', page: '7-8' },
    { section: '7.0', title: 'Calibration', page: '9-10' },
    { section: '8.0', title: 'Reference Standards', page: 11 },
    { section: '9.0', title: 'Inspection Procedures', page: '12-13' },
    { section: '10.0', title: 'Scan Plan & Coverage', page: '14-15' },
    { section: '11.0', title: 'Acceptance Criteria', page: 16 },
    { section: '12.0', title: 'Inspection Results', page: '17-18' },
    { section: '13.0', title: 'Approval & Signatures', page: 19 },
    { section: 'A', title: 'Appendix - Scan Images', page: '20+' },
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Section', 'Description', 'Page']],
    body: tocEntries.map(entry => [entry.section, entry.title, entry.page.toString()]),
    theme: 'striped',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 10, halign: 'center' },
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 110 },
      2: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // List of Figures
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('List of Figures', margin, yPos);
  yPos += 8;

  const figuresList = [
    { fig: 'Figure 1', title: 'Part Schematic Drawing', page: 6 },
    { fig: 'Figure 2', title: 'Calibration Block Drawing', page: 10 },
    { fig: 'Figure 3', title: 'Reference Standards Configuration', page: 11 },
    { fig: 'Figure 4', title: 'Scan Coverage Map', page: 15 },
    { fig: 'Figure 5+', title: 'Ultrasonic Scan Images', page: '20+' },
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Figure', 'Description', 'Page']],
    body: figuresList.map(fig => [fig.fig, fig.title, fig.page.toString()]),
    theme: 'plain',
    headStyles: { fillColor: [100, 100, 100], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 110 },
      2: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // List of Tables
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('List of Tables', margin, yPos);
  yPos += 8;

  const tablesList = [
    { table: 'Table 1', title: 'Equipment Specifications', page: 7 },
    { table: 'Table 2', title: 'Reference Block Specifications', page: 11 },
    { table: 'Table 3', title: 'Scan Plan Matrix', page: 14 },
    { table: 'Table 4', title: 'Acceptance Criteria Summary', page: 16 },
    { table: 'Table 5', title: 'Indication Report', page: 18 },
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Table', 'Description', 'Page']],
    body: tablesList.map(tbl => [tbl.table, tbl.title, tbl.page.toString()]),
    theme: 'plain',
    headStyles: { fillColor: [100, 100, 100], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 110 },
      2: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });
}

// ============= PAGE 3: REVISION HISTORY =============
function drawRevisionHistory(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('REVISION HISTORY', pageWidth / 2, yPos + 3, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // Revision history table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Document Revision Record', margin, yPos);
  yPos += 8;

  const currentDate = new Date().toLocaleDateString('en-US');
  const revisionHistory = [
    [data.documentation.revision || 'A', currentDate, 'Initial Release', data.documentation.inspectorName || 'Inspector', 'Initial document creation'],
    ['B', '', '', '', 'Reserved for future revision'],
    ['C', '', '', '', 'Reserved for future revision'],
    ['D', '', '', '', 'Reserved for future revision'],
    ['E', '', '', '', 'Reserved for future revision'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Rev', 'Date', 'Description of Change', 'Author', 'Approval']],
    body: revisionHistory,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 9, halign: 'center' },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 28 },
      2: { cellWidth: 55 },
      3: { cellWidth: 35 },
      4: { cellWidth: 35 },
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Document Control Information
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Document Control Information', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Field', 'Value']],
    body: [
      ['Document Number', data.documentation.procedureNumber || 'UT-TS-001'],
      ['Document Title', 'Ultrasonic Inspection Technique Sheet'],
      ['Current Revision', data.documentation.revision || 'A'],
      ['Effective Date', currentDate],
      ['Next Review Date', getNextReviewDate()],
      ['Classification', 'Technical Document'],
      ['Distribution', 'Controlled'],
      ['Retention Period', '10 years minimum'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 118 },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Approval signatures for revision
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Document Approval', margin, yPos);
  yPos += 10;

  const approvalBoxWidth = (pageWidth - 2 * margin - 10) / 2;
  const approvalBoxHeight = 35;

  // Author box
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos, approvalBoxWidth, approvalBoxHeight);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Author / Prepared By:', margin + 3, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Name: ' + (data.documentation.inspectorName || '_______________'), margin + 3, yPos + 14);
  doc.text('Level: ' + (data.documentation.inspectorLevel || 'II'), margin + 3, yPos + 20);
  doc.text('Date: _______________', margin + 3, yPos + 26);
  doc.text('Signature: _______________', margin + 3, yPos + 32);

  // Approver box
  doc.rect(margin + approvalBoxWidth + 10, yPos, approvalBoxWidth, approvalBoxHeight);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Approved By:', margin + approvalBoxWidth + 13, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Name: _______________', margin + approvalBoxWidth + 13, yPos + 14);
  doc.text('Level: III', margin + approvalBoxWidth + 13, yPos + 20);
  doc.text('Date: _______________', margin + approvalBoxWidth + 13, yPos + 26);
  doc.text('Signature: _______________', margin + approvalBoxWidth + 13, yPos + 32);
}

// ============= PAGE 4: SCOPE & REFERENCES =============
function drawScopeAndReferences(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SCOPE AND REFERENCES', pageWidth / 2, yPos + 3, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // 1.0 Purpose
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1.0 Purpose', margin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const purposeText = `This technique sheet defines the ultrasonic inspection procedure for ${data.inspectionSetup.partName || 'the subject part'} (P/N: ${data.inspectionSetup.partNumber || 'N/A'}). The inspection is performed in accordance with ${data.standard || 'applicable standards'} to detect internal discontinuities that may affect the structural integrity of the part.`;
  const splitPurpose = doc.splitTextToSize(purposeText, pageWidth - 2 * margin - 10);
  doc.text(splitPurpose, margin + 5, yPos);
  yPos += splitPurpose.length * 4 + 10;

  // 2.0 Scope
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2.0 Scope', margin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const scopeItems = [
    '• This technique sheet applies to production and in-service inspection',
    '• Coverage: 100% volumetric inspection of the entire part',
    '• Inspection method: Contact ultrasonic testing (UT)',
    '• Personnel: Certified Level II or higher per NAS 410 / EN 4179',
  ];
  scopeItems.forEach(item => {
    doc.text(item, margin + 5, yPos);
    yPos += 5;
  });
  yPos += 8;

  // 3.0 Applicable Documents
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3.0 Applicable Documents', margin, yPos);
  yPos += 8;

  const applicableDocs = [
    ['MIL-STD-2154', 'Inspection, Ultrasonic, Wrought Metals, Process For'],
    ['AMS-STD-2154', 'Inspection, Ultrasonic, Wrought Metals'],
    ['ASTM E317', 'Standard Practice for Evaluating Performance of UT Instruments'],
    ['ASTM E127', 'Standard Practice for Fabricating Aluminum Alloy Reference Blocks'],
    ['ASTM E428', 'Standard Practice for Fabricating Steel Reference Blocks'],
    ['NAS 410', 'NAS Certification & Qualification of NDT Personnel'],
    ['EN 4179', 'Aerospace Series - Qualification of NDT Personnel'],
    [data.standard || 'Customer Spec', 'Customer Specific Requirements'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Document Number', 'Title']],
    body: applicableDocs,
    theme: 'striped',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
      1: { cellWidth: 125 },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // 4.0 Definitions and Abbreviations
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('4.0 Definitions and Abbreviations', margin, yPos);
  yPos += 8;

  const definitions = [
    ['UT', 'Ultrasonic Testing'],
    ['FBH', 'Flat Bottom Hole'],
    ['DAC', 'Distance Amplitude Correction'],
    ['TCG', 'Time Corrected Gain'],
    ['MTD', 'Metal Travel Distance'],
    ['BW', 'Back Wall'],
    ['SDH', 'Side Drilled Hole'],
    ['dB', 'Decibel'],
    ['PRF', 'Pulse Repetition Frequency'],
    ['NDT', 'Non-Destructive Testing'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Abbreviation', 'Definition']],
    body: definitions,
    theme: 'grid',
    headStyles: { fillColor: [100, 100, 100], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 130 },
    },
    margin: { left: margin, right: margin },
  });
}

// ============= PAGE 5: PART INFORMATION (1/2) =============
function drawPartInformationPage1(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PART INFORMATION (1/2)', pageWidth / 2, yPos + 3, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // 5.1 Part Identification
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('5.1 Part Identification', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: [
      ['Part Number', data.inspectionSetup.partNumber || 'N/A'],
      ['Part Name', data.inspectionSetup.partName || 'N/A'],
      ['Drawing Number', data.inspectionSetup.drawingNumber || 'N/A'],
      ['Serial Number', data.documentation.serialNumber || 'Per part marking'],
      ['Revision', data.documentation.revision || 'A'],
      ['Customer', data.documentation.customerName || 'N/A'],
      ['Purchase Order', data.documentation.purchaseOrder || 'N/A'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 115 },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // 5.2 Material Specification
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('5.2 Material Specification', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: [
      ['Material', data.inspectionSetup.material || 'N/A'],
      ['Material Specification', data.inspectionSetup.materialSpec || 'N/A'],
      ['Heat Treatment Condition', data.inspectionSetup.heatTreatment || 'Per specification'],
      ['Acoustic Velocity (m/s)', data.inspectionSetup.acousticVelocity?.toString() || '5900 (typical for steel)'],
      ['Density (g/cm³)', data.inspectionSetup.materialDensity?.toString() || 'Per material spec'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 115 },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // 5.3 Part Geometry
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('5.3 Part Geometry', margin, yPos);
  yPos += 8;

  const geometryData = [
    ['Part Type', data.inspectionSetup.partType || 'N/A'],
    ['Configuration', data.inspectionSetup.isHollow ? 'Hollow' : 'Solid'],
    ['Thickness (mm)', data.inspectionSetup.partThickness?.toString() || 'N/A'],
    ['Length (mm)', data.inspectionSetup.partLength?.toString() || 'N/A'],
    ['Width (mm)', data.inspectionSetup.partWidth?.toString() || 'N/A'],
    ['Outer Diameter (mm)', data.inspectionSetup.diameter?.toString() || 'N/A'],
    ['Inner Diameter (mm)', data.inspectionSetup.innerDiameter?.toString() || 'N/A'],
    ['Wall Thickness (mm)', data.inspectionSetup.wallThickness?.toString() || 'N/A'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Dimension', 'Value']],
    body: geometryData,
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 115 },
    },
    margin: { left: margin, right: margin },
  });
}

// ============= PAGE 6: PART INFORMATION (2/2) - DRAWING =============
function drawPartInformationPage2(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PART INFORMATION (2/2)', pageWidth / 2, yPos + 3, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // Figure 1: Part Schematic
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Figure 1: Part Schematic Drawing', margin, yPos);
  yPos += 8;

  // Part diagram area
  const diagramHeight = 130;
  const diagramWidth = pageWidth - 2 * margin;

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos, diagramWidth, diagramHeight);
  doc.setLineWidth(0.2);
  doc.rect(margin + 2, yPos + 2, diagramWidth - 4, diagramHeight - 4);

  const diagramCenterX = margin + diagramWidth / 2;
  const diagramCenterY = yPos + diagramHeight / 2;

  if (data.partDiagram) {
    try {
      doc.addImage(data.partDiagram, 'PNG', margin + 5, yPos + 5, diagramWidth - 10, diagramHeight - 10);
    } catch {
      drawProfessionalPartWithScanDirections(doc, diagramCenterX, diagramCenterY, {
        partType: data.inspectionSetup.partType || 'box',
        length: data.inspectionSetup.partLength || 100,
        width: data.inspectionSetup.partWidth || 50,
        thickness: data.inspectionSetup.partThickness || 25,
        diameter: data.inspectionSetup.diameter,
        innerDiameter: data.inspectionSetup.innerDiameter,
        isHollow: data.inspectionSetup.isHollow,
        scanDirections: []
      });
    }
  } else {
    drawProfessionalPartWithScanDirections(doc, diagramCenterX, diagramCenterY, {
      partType: data.inspectionSetup.partType || 'box',
      length: data.inspectionSetup.partLength || 100,
      width: data.inspectionSetup.partWidth || 50,
      thickness: data.inspectionSetup.partThickness || 25,
      diameter: data.inspectionSetup.diameter,
      innerDiameter: data.inspectionSetup.innerDiameter,
      isHollow: data.inspectionSetup.isHollow,
      scanDirections: []
    });
  }

  yPos += diagramHeight + 10;

  // Surface condition
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('5.4 Surface Condition Requirements', margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const surfaceNotes = [
    '• Surface roughness: ≤ 6.3 μm Ra (250 μin)',
    '• Surface must be free from loose scale, dirt, and foreign matter',
    '• No local grinding depressions that interfere with inspection',
    '• Surface temperature: 10°C to 50°C (50°F to 122°F)',
    '• Couplant compatible with part material',
  ];

  surfaceNotes.forEach((note) => {
    doc.text(note, margin + 5, yPos);
    yPos += 5;
  });

  yPos += 10;

  // Zone identification
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('5.5 Inspection Zones', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Zone', 'Location', 'Coverage', 'Special Requirements']],
    body: [
      ['Zone A', 'Top Surface', '100%', 'Straight beam inspection'],
      ['Zone B', 'Bottom Surface', '100%', 'Straight beam inspection'],
      ['Zone C', 'OD Surface', '100%', 'Straight + Angle beam'],
      ['Zone D', 'ID Surface (if accessible)', 'As applicable', 'Per drawing callout'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: margin, right: margin },
  });
}

function drawEquipmentPage(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('EQUIPMENT (1/2)', pageWidth / 2, yPos + 3, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // Standard Reference
  doc.setFontSize(11);
  doc.text('1. Standard Reference', margin, yPos);
  yPos += 6;

  autoTable(doc, {
    startY: yPos,
    head: [['Standard No', 'Standard Name', 'Configuration']],
    body: [
      [data.standard || 'N/A', 'Reference Standard Block', data.calibration.standardType || 'N/A'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Ultrasonic Unit
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Ultrasonic Unit', margin, yPos);
  yPos += 6;

  autoTable(doc, {
    startY: yPos,
    head: [['Model (S/N)', 'Frequency Range', 'Specifications', 'Manufacturer']],
    body: [
      [
        `${data.equipment.model || 'N/A'} (${data.equipment.serialNumber || 'N/A'})`,
        '0.5 ~ 20 MHz',
        'Digital display, 110 dB dynamic range',
        data.equipment.manufacturer || 'N/A',
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Transducers
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Transducer(s)', margin, yPos);
  yPos += 6;

  autoTable(doc, {
    startY: yPos,
    head: [['Type', 'Frequency', 'Size/Diameter', 'Element', 'P/N', 'Serial No', 'Manufacturer']],
    body: [
      [
        data.equipment.transducerType || 'N/A',
        data.equipment.frequency || 'N/A',
        data.equipment.transducerDiameter ? `Ø ${data.equipment.transducerDiameter}"` : 'N/A',
        '1',
        'N/A',
        data.equipment.serialNumber || 'N/A',
        data.equipment.manufacturer || 'N/A',
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Couplant
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Couplant', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(data.equipment.couplant || 'SAE 30 motor oil according to SAE J300', margin + 5, yPos);

  yPos += 15;

  // Material to be Inspected
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('5. Material to be Inspected', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${data.inspectionSetup.material || 'N/A'} (${data.inspectionSetup.materialSpec || 'N/A'})`, margin + 5, yPos);

  yPos += 15;

  // Inspection Area
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('6. Inspection Area', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Whole surface of the part', margin + 5, yPos);
}

// ============= PAGE 8: EQUIPMENT (2/2) =============
function drawEquipmentPage2(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('EQUIPMENT (2/2)', pageWidth / 2, yPos + 3, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // Cables and Accessories
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('7. Cables and Accessories', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Item', 'Specification', 'P/N', 'Remarks']],
    body: [
      ['Coaxial Cable', 'RG-58, 1.5m length', 'N/A', 'BNC connectors'],
      ['Wedge', data.equipment.wedgeType || 'N/A', 'N/A', 'For angle beam if required'],
      ['Delay Line', data.equipment.delayLine || 'N/A', 'N/A', 'If applicable'],
      ['Scanner/Holder', 'Manual', 'N/A', 'Contact scanning'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Equipment Verification
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('8. Equipment Verification Requirements', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Check Item', 'Frequency', 'Acceptance Criteria', 'Reference']],
    body: [
      ['Linearity (Vertical)', 'Annual', '±2% full screen height', 'ASTM E317'],
      ['Linearity (Horizontal)', 'Annual', '±1% full screen width', 'ASTM E317'],
      ['Sensitivity', 'Before each inspection', 'Per calibration procedure', 'MIL-STD-2154'],
      ['Resolution', 'Annual', 'Per equipment spec', 'ASTM E317'],
      ['DAC Accuracy', 'Daily', '±1 dB', 'MIL-STD-2154'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Probe Verification
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('9. Probe Verification Requirements', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Requirement', 'Tolerance', 'Method']],
    body: [
      ['Center Frequency', 'Per probe specification', '±10%', 'Spectrum analysis'],
      ['Bandwidth', 'Per probe specification', '-6 dB', 'Spectrum analysis'],
      ['Beam Profile', 'Symmetrical', 'Per ASTM E1065', 'Beam plot'],
      ['Dead Zone', 'Minimum 2mm', 'N/A', 'IIW block'],
      ['Near Field Length', 'Per calculation', '±10%', 'Theoretical'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Couplant Requirements
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('10. Couplant Requirements', margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const couplantNotes = [
    `• Couplant Type: ${data.equipment.couplant || 'SAE 30 motor oil or equivalent'}`,
    '• Couplant must be compatible with part material (no corrosion)',
    '• Apply thin, uniform layer sufficient for acoustic coupling',
    '• Remove all couplant residue after inspection',
    '• Maintain couplant temperature within ±5°C of part temperature',
  ];

  couplantNotes.forEach((note) => {
    doc.text(note, margin + 5, yPos);
    yPos += 5;
  });

  yPos += 10;

  // Equipment calibration status box
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Equipment Calibration Status', margin, yPos);
  yPos += 8;

  const boxHeight = 40;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos, pageWidth - 2 * margin, boxHeight);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('UT Instrument Cal Due: _______________', margin + 5, yPos + 10);
  doc.text('Probe Cal Due: _______________', margin + 5, yPos + 20);
  doc.text('Reference Blocks Cal Due: _______________', margin + 5, yPos + 30);

  doc.text('Certificate #: _______________', margin + 95, yPos + 10);
  doc.text('Certificate #: _______________', margin + 95, yPos + 20);
  doc.text('Certificate #: _______________', margin + 95, yPos + 30);
}

function drawCalibrationPage(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CALIBRATION (1/2)', pageWidth / 2, yPos + 3, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // Calibration specifications
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('7.1 Calibration Specifications', margin, yPos);
  yPos += 6;

  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: [
      ['Standard Type', data.calibration.standardType || 'N/A'],
      ['Block Type', getBlockTypeName(data.calibration.standardType as CalibrationBlockType)],
      ['Reference Material', data.calibration.referenceMaterial || 'N/A'],
      ['FBH Sizes', data.calibration.fbhSizes || 'N/A'],
      ['Metal Travel Distance (mm)', data.calibration.metalTravelDistance?.toString() || 'N/A'],
      ['Block Dimensions', data.calibration.blockDimensions || 'N/A'],
      ['Block Serial Number', data.calibration.blockSerialNumber || 'N/A'],
      ['Last Calibration Date', data.calibration.lastCalibrationDate || 'N/A'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Technical Drawing Section - PROFESSIONAL 3D ISOMETRIC
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Calibration Block - Technical Drawing', margin, yPos);
  yPos += 6;

  // Draw the calibration block with professional isometric style
  const drawingHeight = 110;
  const drawingWidth = pageWidth - 2 * margin;
  
  // Drawing frame with professional border
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos, drawingWidth, drawingHeight);
  
  // Inner frame
  doc.setLineWidth(0.2);
  doc.rect(margin + 2, yPos + 2, drawingWidth - 4, drawingHeight - 4);

  // Determine the appropriate block type based on part geometry
  const effectiveBlockType = getAppropriateBlockType(
    data.calibration.standardType,
    data.inspectionSetup.partType,
    data.inspectionSetup.partThickness
  );

  // Use professional 3D isometric drawing
  const drawingCenterX = margin + drawingWidth / 2;
  const drawingCenterY = yPos + drawingHeight / 2;
  
  // Get dynamic dimensions from user input
  const partThickness = data.inspectionSetup.partThickness || 75;
  const partLength = data.inspectionSetup.partLength || 100;
  const partWidth = data.inspectionSetup.partWidth || 50;
  const partDiameter = data.inspectionSetup.diameter || 50.8; // Default 2" per ASTM E127
  const fbhSizes = data.calibration.fbhSizes?.split(',').map(s => s.trim()) || ['3/64"'];
  
  drawProfessionalCalibrationBlock(
    doc,
    effectiveBlockType,
    drawingCenterX,
    drawingCenterY,
    {
      length: partLength,
      width: partWidth,
      height: partThickness,  // This determines the 3 block heights (30%, 60%, 90%)
      outerDiameter: partDiameter,
      innerDiameter: data.inspectionSetup.innerDiameter || 0,
      fbhSizes: fbhSizes
    }
  );

  yPos += drawingHeight + 10;

  // Figure reference
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(getBlockFigureReference(effectiveBlockType), pageWidth / 2, yPos, { align: 'center' });
}

// ============= PAGE 10: CALIBRATION (2/2) - DAC/TCG =============
function drawCalibrationPage2(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CALIBRATION (2/2)', pageWidth / 2, yPos + 3, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // DAC Curve Setup
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('7.2 DAC (Distance Amplitude Correction) Setup', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Value', 'Remarks']],
    body: [
      ['Reference Reflector', data.calibration.fbhSizes?.split(',')[0]?.trim() || '3/64" FBH', 'Per MIL-STD-2154'],
      ['DAC Points', 'Minimum 3', 'At 30%, 60%, 90% of thickness'],
      ['Transfer Correction', 'Applied', 'Surface roughness compensation'],
      ['Evaluation Level', 'DAC', '100% DAC = recording level'],
      ['Recording Level', '50% DAC', 'All indications ≥ 50% DAC'],
      ['Rejection Level', '100% DAC', 'Indications ≥ 100% DAC require evaluation'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // DAC Curve Drawing Area
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Figure 2: DAC Curve', margin, yPos);
  yPos += 6;

  const curveHeight = 70;
  const curveWidth = pageWidth - 2 * margin;
  
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos, curveWidth, curveHeight);

  // Draw DAC curve schematic
  const graphX = margin + 15;
  const graphY = yPos + curveHeight - 10;
  const graphWidth = curveWidth - 30;
  const graphHeight = curveHeight - 20;

  // Axes
  doc.setLineWidth(0.5);
  doc.line(graphX, graphY, graphX + graphWidth, graphY); // X axis
  doc.line(graphX, graphY, graphX, graphY - graphHeight); // Y axis

  // Axis labels
  doc.setFontSize(7);
  doc.text('Metal Travel Distance (mm)', graphX + graphWidth / 2, graphY + 7, { align: 'center' });
  doc.text('Amplitude (%)', graphX - 5, graphY - graphHeight / 2, { align: 'right' });

  // DAC curve (exponential decay approximation)
  doc.setDrawColor(0, 100, 200);
  doc.setLineWidth(0.8);
  
  const points = [
    { x: graphX + graphWidth * 0.1, y: graphY - graphHeight * 0.95 },
    { x: graphX + graphWidth * 0.3, y: graphY - graphHeight * 0.75 },
    { x: graphX + graphWidth * 0.5, y: graphY - graphHeight * 0.55 },
    { x: graphX + graphWidth * 0.7, y: graphY - graphHeight * 0.40 },
    { x: graphX + graphWidth * 0.9, y: graphY - graphHeight * 0.30 },
  ];

  // Draw curve
  for (let i = 0; i < points.length - 1; i++) {
    doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
  }

  // Draw points
  doc.setFillColor(0, 100, 200);
  points.forEach(p => {
    doc.circle(p.x, p.y, 1.5, 'F');
  });

  // 100% line (dashed)
  doc.setDrawColor(200, 0, 0);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(graphX, graphY - graphHeight * 0.5, graphX + graphWidth, graphY - graphHeight * 0.5);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(6);
  doc.setTextColor(200, 0, 0);
  doc.text('100% DAC', graphX + graphWidth + 2, graphY - graphHeight * 0.5);
  doc.setTextColor(0, 0, 0);

  doc.setDrawColor(0);
  yPos += curveHeight + 10;

  // Calibration Procedure
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('7.3 Calibration Procedure', margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const calibProcedure = [
    '1. Verify equipment is within calibration date',
    '2. Apply couplant to reference block surface',
    '3. Position probe on first FBH location (shallowest)',
    '4. Adjust gain to set echo amplitude at 80% FSH',
    '5. Move to next FBH locations, mark amplitudes on display',
    '6. Connect points to form DAC curve',
    '7. Verify back wall echo (if applicable)',
    '8. Record calibration settings and date',
    '9. Re-calibrate if ambient temperature changes by >5°C',
  ];

  calibProcedure.forEach((step, idx) => {
    doc.text(step, margin + 5, yPos);
    yPos += 5;
  });

  yPos += 8;

  // Calibration verification box
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Calibration Verification', margin, yPos);
  yPos += 6;

  const verifyBoxHeight = 30;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos, pageWidth - 2 * margin, verifyBoxHeight);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Calibration verified by: _______________', margin + 5, yPos + 8);
  doc.text('Date/Time: _______________', margin + 5, yPos + 16);
  doc.text('Signature: _______________', margin + 5, yPos + 24);

  doc.text('Post-inspection verification by: _______________', margin + 95, yPos + 8);
  doc.text('Date/Time: _______________', margin + 95, yPos + 16);
  doc.text('Signature: _______________', margin + 95, yPos + 24);
}

// ============= PAGE 12: INSPECTION PROCEDURES (1/2) =============
function drawInspectionProceduresPage1(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INSPECTION PROCEDURES (1/2)', pageWidth / 2, yPos + 3, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // Pre-inspection requirements
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('9.1 Pre-Inspection Requirements', margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const preInspection = [
    '• Verify part identification matches documentation',
    '• Verify part is clean and free from foreign materials',
    '• Verify surface condition meets requirements (≤ 6.3 μm Ra)',
    '• Verify part temperature is within acceptable range (10-50°C)',
    '• Review engineering drawing for inspection zones and special requirements',
    '• Verify equipment calibration is current',
    '• Perform system calibration per Section 7',
  ];

  preInspection.forEach((item) => {
    doc.text(item, margin + 5, yPos);
    yPos += 5;
  });

  yPos += 10;

  // Scanning technique
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('9.2 Scanning Technique', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Requirement']],
    body: [
      ['Scanning Method', 'Contact method with manual scanning'],
      ['Probe Movement', 'Maintain perpendicular contact, overlap scans by 50%'],
      ['Scan Speed', '≤ 150 mm/s maximum'],
      ['Scan Index', `${data.scanParameters.scanIndex || '3-5'} mm between passes`],
      ['Couplant', 'Continuous thin film during scanning'],
      ['Coverage', '100% of inspection area'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Straight beam procedure
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('9.3 Straight Beam Inspection Procedure', margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const straightBeam = [
    '1. Apply couplant to part surface',
    '2. Position probe at start of inspection zone',
    '3. Scan systematically maintaining probe perpendicular to surface',
    '4. Observe A-scan display for indications',
    '5. Monitor back wall echo for consistency',
    '6. Mark any indications exceeding recording level',
    '7. Complete full coverage of zone before moving to next',
    '8. Clean excess couplant during and after inspection',
  ];

  straightBeam.forEach((step) => {
    doc.text(step, margin + 5, yPos);
    yPos += 5;
  });

  yPos += 10;

  // Angle beam procedure
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('9.4 Angle Beam Inspection Procedure (if applicable)', margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const angleBeam = [
    '1. Mount appropriate wedge on transducer',
    '2. Verify beam angle using IIW or V-block',
    '3. Calibrate sensitivity on reference block SDH',
    '4. Scan in both CW and CCW directions for complete coverage',
    '5. Maintain wedge contact angle during scanning',
    '6. Note beam path distance for all indications',
  ];

  angleBeam.forEach((step) => {
    doc.text(step, margin + 5, yPos);
    yPos += 5;
  });
}

// ============= PAGE 13: INSPECTION PROCEDURES (2/2) =============
function drawInspectionProceduresPage2(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INSPECTION PROCEDURES (2/2)', pageWidth / 2, yPos + 3, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // Indication evaluation
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('9.5 Indication Evaluation', margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const evaluation = [
    '• Maximize indication amplitude by adjusting probe position/angle',
    '• Record peak amplitude relative to DAC curve',
    '• Determine indication location (X, Y, depth)',
    '• Characterize indication type (point, linear, planar)',
    '• Measure indication length for linear discontinuities',
    '• Document all recordable indications per Section 12',
  ];

  evaluation.forEach((item) => {
    doc.text(item, margin + 5, yPos);
    yPos += 5;
  });

  yPos += 10;

  // Post-inspection
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('9.6 Post-Inspection Requirements', margin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const postInspection = [
    '• Verify system calibration has not drifted (recalibrate and retest if >2 dB shift)',
    '• Remove all couplant residue from part',
    '• Complete inspection report and indication log',
    '• Apply appropriate inspection stamp/marking (if required)',
    '• Obtain required signatures and approvals',
  ];

  postInspection.forEach((item) => {
    doc.text(item, margin + 5, yPos);
    yPos += 5;
  });

  yPos += 12;

  // Special instructions
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('9.7 Special Instructions', margin, yPos);
  yPos += 8;

  const specialBoxHeight = 45;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos, pageWidth - 2 * margin, specialBoxHeight);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const specialText = data.acceptanceCriteria.specialRequirements || 
    'No special instructions. Follow standard procedures as defined in this technique sheet.';
  const splitSpecial = doc.splitTextToSize(specialText, pageWidth - 2 * margin - 10);
  doc.text(splitSpecial, margin + 5, yPos + 8);

  yPos += specialBoxHeight + 12;

  // Inspection sequence table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('9.8 Inspection Sequence Summary', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Step', 'Action', 'Verification']],
    body: [
      ['1', 'Part identification and documentation review', 'Check'],
      ['2', 'Surface preparation verification', 'Check'],
      ['3', 'Equipment setup and calibration', 'Check'],
      ['4', 'Straight beam inspection - all zones', 'Record'],
      ['5', 'Angle beam inspection (if required)', 'Record'],
      ['6', 'Post-calibration verification', 'Check'],
      ['7', 'Indication evaluation and documentation', 'Record'],
      ['8', 'Part marking and final report', 'Sign'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 105 },
      2: { cellWidth: 40, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });
}

// ============= PAGE 14: SCAN PLAN =============
function drawScanPlanPage(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SCAN PLAN', pageWidth / 2, yPos + 3, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // Scan matrix table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Table 3: Scan Plan Matrix', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Seq.', 'Surface', 'Wave Mode', 'Direction', 'Sensitivity', 'Angle', 'Probe', 'Notes']],
    body: [
      ['1', 'Face A', 'Longitudinal', 'Axial', data.calibration.fbhSizes?.split(',')[0]?.trim() || '3/64" FBH', '0°', data.equipment.transducerType || 'MSEB2', '100% coverage'],
      ['2', 'Face B', 'Longitudinal', 'Axial', data.calibration.fbhSizes?.split(',')[0]?.trim() || '3/64" FBH', '0°', data.equipment.transducerType || 'MSEB2', '100% coverage'],
      ['3', 'OD', 'Longitudinal', 'Radial', data.calibration.fbhSizes?.split(',')[0]?.trim() || '3/64" FBH', '0°', data.equipment.transducerType || 'MSEB2', '100% coverage'],
      ['4', 'OD', 'Shear', 'CW', data.calibration.fbhSizes?.split(',')[0]?.trim() || '3/64" FBH', '45°', 'MWB45-2', 'If required'],
      ['5', 'OD', 'Shear', 'CCW', data.calibration.fbhSizes?.split(',')[0]?.trim() || '3/64" FBH', '45°', 'MWB45-2', 'If required'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 28 },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 22 },
      7: { cellWidth: 28 },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Scan parameters
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('10.1 Scan Parameters', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: [
      ['Scan Method', data.scanParameters.scanMethod || 'Contact'],
      ['Scan Type', data.scanParameters.scanType || 'Manual'],
      ['Scan Pattern', data.scanParameters.scanPattern || 'Raster'],
      ['Scan Speed (mm/s)', data.scanParameters.scanSpeed?.toString() || '≤ 150'],
      ['Scan Index (mm)', data.scanParameters.scanIndex?.toString() || '3-5'],
      ['Overlap (%)', '50'],
      ['Pulse Repetition Rate (Hz)', data.scanParameters.pulseRepetitionRate?.toString() || '1000'],
      ['Gain Settings (dB)', data.scanParameters.gainSettings || 'Per calibration'],
      ['Gate Settings', data.scanParameters.alarmGateSettings || 'Interface to BW'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 110 },
    },
    margin: { left: margin, right: margin },
  });
}

// ============= PAGE 15: COVERAGE MAP =============
function drawCoverageMapPage(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('COVERAGE MAP', pageWidth / 2, yPos + 3, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // Coverage diagram title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('10.1 Zone Coverage Diagram', margin, yPos);
  yPos += 8;

  const mapHeight = 100;
  const mapWidth = pageWidth - 2 * margin;

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos, mapWidth, mapHeight);

  // Draw coverage zones schematic (different from part diagram)
  const partType = data.inspectionSetup.partType || 'box';
  const isCylindrical = ['tube', 'pipe', 'cylinder', 'round_bar', 'ring', 'ring_forging'].includes(partType);
  
  if (isCylindrical) {
    // Draw cylindrical coverage zones
    drawCylindricalCoverageZones(doc, margin + mapWidth / 2, yPos + mapHeight / 2, data);
  } else {
    // Draw rectangular coverage zones
    drawRectangularCoverageZones(doc, margin + mapWidth / 2, yPos + mapHeight / 2, data);
  }

  yPos += mapHeight + 10;

  // Legend
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Legend - Coverage Zones', margin, yPos);
  yPos += 8;

  // Draw legend items with zone colors
  const legendItems = [
    { color: [46, 204, 113], label: 'Zone A - Top Surface (Straight Beam 0°)' },
    { color: [52, 152, 219], label: 'Zone B - Bottom Surface (Straight Beam 0°)' },
    { color: [155, 89, 182], label: 'Zone C - Side/OD Surface (Straight Beam)' },
    { color: [241, 196, 15], label: 'Zone D - Angle Beam CW (45°-70°)' },
    { color: [231, 76, 60], label: 'Zone E - Angle Beam CCW (45°-70°)' },
  ];

  legendItems.forEach((item, idx) => {
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.rect(margin + 5, yPos - 3, 12, 5, 'F');
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);
    doc.rect(margin + 5, yPos - 3, 12, 5, 'S');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(item.label, margin + 22, yPos);
    yPos += 7;
  });

  yPos += 8;

  // Coverage summary table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('10.2 Coverage Summary', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Zone', 'Surface', 'Scan Type', 'Probe Angle', 'Coverage %', 'Status']],
    body: [
      ['A', 'Top Face', 'Straight Beam', '0°', '100%', '☐ Complete'],
      ['B', 'Bottom Face', 'Straight Beam', '0°', '100%', '☐ Complete'],
      ['C', 'OD Surface', 'Straight Beam', '0°', '100%', '☐ Complete'],
      ['D', 'OD Surface', 'Angle Beam', '45° CW', '100%', '☐ Complete'],
      ['E', 'OD Surface', 'Angle Beam', '45° CCW', '100%', '☐ Complete'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 35, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });

  // Notes section
  const finalY = (doc as any).lastAutoTable?.finalY || yPos + 60;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Notes:', margin, finalY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('• All zones require 100% coverage with minimum 10% overlap between scan passes', margin + 5, finalY + 17);
  doc.text('• Angle beam scans performed in both CW and CCW directions where applicable', margin + 5, finalY + 23);
  doc.text('• Coverage verified by back-wall echo monitoring or scan index verification', margin + 5, finalY + 29);
}

// Helper: Draw cylindrical coverage zones
function drawCylindricalCoverageZones(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  data: ComprehensiveTechniqueSheetData
) {
  const diameter = Math.min(data.inspectionSetup.diameter || 100, 80);
  const length = Math.min(data.inspectionSetup.partLength || 100, 60);
  const radius = diameter / 2 * 0.8;
  
  // Side view (left)
  const sideX = centerX - 50;
  
  // Zone A - Top (green)
  doc.setFillColor(46, 204, 113);
  doc.setDrawColor(0);
  doc.rect(sideX - length/2, centerY - radius, length, 8, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(255);
  doc.text('A', sideX, centerY - radius + 5, { align: 'center' });
  
  // Zone B - Bottom (blue)
  doc.setFillColor(52, 152, 219);
  doc.rect(sideX - length/2, centerY + radius - 8, length, 8, 'FD');
  doc.text('B', sideX, centerY + radius - 3, { align: 'center' });
  
  // Zone C - Side (purple) - middle area
  doc.setFillColor(155, 89, 182);
  doc.rect(sideX - length/2, centerY - radius + 8, length, 2*radius - 16, 'FD');
  doc.setTextColor(255);
  doc.text('C', sideX, centerY, { align: 'center' });
  
  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.text('SIDE VIEW', sideX, centerY + radius + 15, { align: 'center' });
  
  // End view (right) - circle with zones
  const endX = centerX + 50;
  
  // Draw full circle outline
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  
  // Zone D - Angle CW (yellow arc - right side)
  doc.setFillColor(241, 196, 15);
  doc.setDrawColor(0);
  // Draw as quarter arc approximation
  const arcRadius = radius - 5;
  doc.ellipse(endX + arcRadius * 0.7, centerY, 10, arcRadius * 0.8, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(0);
  doc.text('D', endX + arcRadius + 5, centerY, { align: 'center' });
  
  // Zone E - Angle CCW (red arc - left side)  
  doc.setFillColor(231, 76, 60);
  doc.ellipse(endX - arcRadius * 0.7, centerY, 10, arcRadius * 0.8, 'FD');
  doc.text('E', endX - arcRadius - 5, centerY, { align: 'center' });
  
  // Main circle
  doc.setFillColor(200, 200, 200);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.circle(endX, centerY, radius, 'S');
  
  // Inner circle if hollow
  if (data.inspectionSetup.isHollow && data.inspectionSetup.innerDiameter) {
    const innerR = (data.inspectionSetup.innerDiameter / data.inspectionSetup.diameter!) * radius;
    doc.setFillColor(255, 255, 255);
    doc.circle(endX, centerY, innerR, 'FD');
  }
  
  // Crosshair
  doc.setDrawColor(100);
  doc.setLineWidth(0.2);
  doc.line(endX - radius - 5, centerY, endX + radius + 5, centerY);
  doc.line(endX, centerY - radius - 5, endX, centerY + radius + 5);
  
  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.text('END VIEW', endX, centerY + radius + 15, { align: 'center' });
}

// Helper: Draw rectangular coverage zones
function drawRectangularCoverageZones(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  data: ComprehensiveTechniqueSheetData
) {
  const width = Math.min(data.inspectionSetup.partLength || 100, 100);
  const height = Math.min(data.inspectionSetup.partWidth || 50, 40);
  const thickness = Math.min(data.inspectionSetup.partThickness || 25, 20);
  
  // Top view (plan view)
  const topX = centerX - 40;
  const topY = centerY - 20;
  
  // Zone A - Top surface (green)
  doc.setFillColor(46, 204, 113);
  doc.setDrawColor(0);
  doc.rect(topX - width/2, topY - height/2, width, height, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(255);
  doc.text('ZONE A', topX, topY, { align: 'center' });
  doc.setFontSize(7);
  doc.text('(Top Surface)', topX, topY + 6, { align: 'center' });
  
  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.text('TOP VIEW', topX, topY + height/2 + 10, { align: 'center' });
  
  // Side view (elevation)
  const sideX = centerX + 50;
  const sideY = centerY - 10;
  const sideWidth = Math.min(width * 0.6, 60);
  const sideHeight = thickness;
  
  // Zone C - Side surface (purple)
  doc.setFillColor(155, 89, 182);
  doc.rect(sideX - sideWidth/2, sideY - sideHeight/2, sideWidth, sideHeight, 'FD');
  
  // Zone D - Angle CW (yellow - right edge)
  doc.setFillColor(241, 196, 15);
  doc.rect(sideX + sideWidth/2 - 8, sideY - sideHeight/2, 8, sideHeight, 'FD');
  doc.setFontSize(6);
  doc.setTextColor(0);
  doc.text('D', sideX + sideWidth/2 - 4, sideY + 2, { align: 'center' });
  
  // Zone E - Angle CCW (red - left edge)
  doc.setFillColor(231, 76, 60);
  doc.rect(sideX - sideWidth/2, sideY - sideHeight/2, 8, sideHeight, 'FD');
  doc.text('E', sideX - sideWidth/2 + 4, sideY + 2, { align: 'center' });
  
  doc.setFontSize(7);
  doc.setTextColor(255);
  doc.text('C', sideX, sideY + 2, { align: 'center' });
  
  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.text('SIDE VIEW', sideX, sideY + sideHeight/2 + 10, { align: 'center' });
  
  // Zone B indicator (bottom - shown as text)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Zone B (Bottom) - Mirror of Zone A', centerX, centerY + 35, { align: 'center' });
}

// ============= PAGE 17: INSPECTION RESULTS =============
function drawInspectionResultsPage1(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INSPECTION RESULTS', pageWidth / 2, yPos + 3, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // Results summary
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('12.1 Results Summary', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Item', 'Result']],
    body: [
      ['Part Number', data.inspectionSetup.partNumber || 'N/A'],
      ['Serial Number', data.documentation.serialNumber || 'N/A'],
      ['Inspection Date', data.documentation.inspectionDate || new Date().toLocaleDateString()],
      ['Inspector', `${data.documentation.inspectorName || 'N/A'} (Level ${data.documentation.inspectorLevel || 'II'})`],
      ['Total Zones Inspected', '5'],
      ['Recordable Indications', '☐ None  ☐ See Indication Report'],
      ['Back Wall Consistency', '☐ Acceptable  ☐ See Notes'],
      ['Overall Result', '☐ ACCEPT  ☐ REJECT  ☐ CONDITIONAL'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 115 },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Zone results
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('12.2 Zone-by-Zone Results', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Zone', 'Surface', 'Scan Type', 'Max Amplitude', 'BW Echo', 'Result']],
    body: [
      ['A', 'Top Face', 'SB 0°', '___% DAC', '___% FSH', '☐ A  ☐ R'],
      ['B', 'Bottom Face', 'SB 0°', '___% DAC', '___% FSH', '☐ A  ☐ R'],
      ['C', 'OD', 'SB 0°', '___% DAC', '___% FSH', '☐ A  ☐ R'],
      ['D', 'OD', 'AB CW', '___% DAC', 'N/A', '☐ A  ☐ R'],
      ['E', 'OD', 'AB CCW', '___% DAC', 'N/A', '☐ A  ☐ R'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 30 },
      2: { cellWidth: 25 },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' },
      5: { cellWidth: 35, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Notes section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('12.3 Inspection Notes', margin, yPos);
  yPos += 6;

  const notesHeight = 50;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos, pageWidth - 2 * margin, notesHeight);

  // Lines for writing
  for (let i = 1; i <= 4; i++) {
    const lineY = yPos + i * 10;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(margin + 5, lineY, pageWidth - margin - 5, lineY);
  }
  doc.setDrawColor(0);

  yPos += notesHeight + 10;

  // Calibration verification
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Calibration Verification', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Pre-inspection calibration: ☐ Verified   Time: _____   Gain: _____ dB', margin + 5, yPos);
  yPos += 5;
  doc.text('Post-inspection calibration: ☐ Verified   Time: _____   Drift: _____ dB', margin + 5, yPos);
  yPos += 5;
  doc.text('Calibration within tolerance (±2 dB): ☐ Yes  ☐ No - Retest required', margin + 5, yPos);
}

// ============= PAGE 18: INDICATION REPORT =============
function drawIndicationReportPage(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INDICATION REPORT', pageWidth / 2, yPos + 3, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 20;

  // Indication log table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Table 5: Indication Log', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['No.', 'Zone', 'Location (X,Y,Z)', 'Depth (mm)', 'Amplitude', 'Length', 'Type', 'Disposition']],
    body: [
      ['1', '', '', '', '% DAC', '', '', '☐ A ☐ R'],
      ['2', '', '', '', '% DAC', '', '', '☐ A ☐ R'],
      ['3', '', '', '', '% DAC', '', '', '☐ A ☐ R'],
      ['4', '', '', '', '% DAC', '', '', '☐ A ☐ R'],
      ['5', '', '', '', '% DAC', '', '', '☐ A ☐ R'],
      ['6', '', '', '', '% DAC', '', '', '☐ A ☐ R'],
      ['7', '', '', '', '% DAC', '', '', '☐ A ☐ R'],
      ['8', '', '', '', '% DAC', '', '', '☐ A ☐ R'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 18 },
      2: { cellWidth: 32 },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 20 },
      7: { cellWidth: 26, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Legend
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Legend', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Type: P = Point, L = Linear, A = Area', margin + 5, yPos);
  yPos += 4;
  doc.text('Disposition: A = Accept, R = Reject', margin + 5, yPos);
  yPos += 4;
  doc.text('Amplitude: Relative to DAC curve (100% DAC = evaluation level)', margin + 5, yPos);

  yPos += 12;

  // Acceptance criteria summary
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Acceptance Criteria Applied', margin, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Criteria', 'Requirement', 'Reference']],
    body: [
      ['Single Discontinuity', data.acceptanceCriteria.singleDiscontinuity || '< 100% DAC', data.standard || 'MIL-STD-2154'],
      ['Multiple Discontinuities', data.acceptanceCriteria.multipleDiscontinuities || 'Per specification', data.standard || 'MIL-STD-2154'],
      ['Linear Discontinuity', data.acceptanceCriteria.linearDiscontinuity || 'Length < t/4', data.standard || 'MIL-STD-2154'],
      ['Back Reflection Loss', `≤ ${data.acceptanceCriteria.backReflectionLoss || 50}%`, data.standard || 'MIL-STD-2154'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [100, 100, 100], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 70 },
      2: { cellWidth: 50 },
    },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Final disposition
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Final Disposition', margin, yPos);
  yPos += 8;

  const dispHeight = 30;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos, pageWidth - 2 * margin, dispHeight);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const checkboxSize = 5;
  
  doc.rect(margin + 15, yPos + 10, checkboxSize, checkboxSize);
  doc.text('ACCEPT', margin + 25, yPos + 15);
  
  doc.rect(margin + 70, yPos + 10, checkboxSize, checkboxSize);
  doc.text('REJECT', margin + 80, yPos + 15);
  
  doc.rect(margin + 120, yPos + 10, checkboxSize, checkboxSize);
  doc.text('CONDITIONAL ACCEPT', margin + 130, yPos + 15);
}

// ============= PAGE 19: APPROVAL & SIGNATURES =============
function drawApprovalSignaturesPage(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFillColor(41, 128, 185);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('APPROVAL & SIGNATURES', pageWidth / 2, yPos + 3, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 25;

  // Inspector signature
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('13.1 Inspector Certification', margin, yPos);
  yPos += 10;

  const sigBoxWidth = pageWidth - 2 * margin;
  const sigBoxHeight = 50;

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos, sigBoxWidth, sigBoxHeight);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('I certify that the above inspection was performed in accordance with this technique sheet', margin + 5, yPos + 10);
  doc.text('and the results accurately represent the condition of the part.', margin + 5, yPos + 16);

  doc.setFontSize(9);
  doc.text(`Inspector Name: ${data.documentation.inspectorName || '_______________'}`, margin + 5, yPos + 28);
  doc.text(`Certification Level: ${data.documentation.inspectorLevel || 'II'}`, margin + 95, yPos + 28);
  doc.text('Certification #: _______________', margin + 5, yPos + 36);
  doc.text('Signature: _______________', margin + 95, yPos + 36);
  doc.text('Date: _______________', margin + 5, yPos + 44);

  yPos += sigBoxHeight + 15;

  // Level III Review
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('13.2 Level III Review', margin, yPos);
  yPos += 10;

  doc.setLineWidth(0.5);
  doc.rect(margin, yPos, sigBoxWidth, sigBoxHeight);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('I have reviewed this technique sheet and inspection results. The inspection was performed', margin + 5, yPos + 10);
  doc.text('correctly and the results are acceptable.', margin + 5, yPos + 16);

  doc.setFontSize(9);
  doc.text('Level III Name: _______________', margin + 5, yPos + 28);
  doc.text('Certification #: _______________', margin + 95, yPos + 28);
  doc.text('Signature: _______________', margin + 5, yPos + 36);
  doc.text('Date: _______________', margin + 95, yPos + 36);

  yPos += sigBoxHeight + 15;

  // Customer/QA Approval
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('13.3 Customer / Quality Assurance Approval', margin, yPos);
  yPos += 10;

  doc.setLineWidth(0.5);
  doc.rect(margin, yPos, sigBoxWidth, sigBoxHeight);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('This inspection report has been reviewed and approved by the customer representative', margin + 5, yPos + 10);
  doc.text('or quality assurance department.', margin + 5, yPos + 16);

  doc.setFontSize(9);
  doc.text(`Organization: ${data.documentation.certifyingOrganization || '_______________'}`, margin + 5, yPos + 28);
  doc.text('Representative Name: _______________', margin + 5, yPos + 36);
  doc.text('Signature: _______________', margin + 95, yPos + 36);
  doc.text('Date: _______________', margin + 5, yPos + 44);

  yPos += sigBoxHeight + 15;

  // Document control box
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Document Control', margin, yPos);
  yPos += 8;

  const controlBoxHeight = 25;
  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos, sigBoxWidth, controlBoxHeight);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Document Number: ${data.documentation.procedureNumber || 'UT-TS-001'}`, margin + 5, yPos + 8);
  doc.text(`Revision: ${data.documentation.revision || 'A'}`, margin + 80, yPos + 8);
  doc.text(`Effective Date: ${data.documentation.inspectionDate || new Date().toLocaleDateString()}`, margin + 120, yPos + 8);
  doc.text('This document is controlled. Verify current revision before use.', margin + 5, yPos + 18);
}

// Helper function for next review date
function getNextReviewDate(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toLocaleDateString('en-US');
}

/**
 * Draw Reference Standards page with detailed calibration block specifications
 * Based on TÜV Technique Sheet Fig. 3 format
 */
function drawReferenceStandardsPage(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Reference Standards', margin, yPos);
  yPos += 4;

  // Subtitle - Figure reference
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('Figure 3: Calibration Block Specifications', margin, yPos);
  yPos += 10;

  // Get block type and part info - ALL DYNAMIC from user input
  const blockType = data.calibration.blockType || 'solid_cylinder_fbh';
  const partThickness = data.inspectionSetup.partThickness || 100;
  const blockDiameter = data.inspectionSetup.diameter || 50.8; // Default 2" per ASTM E127
  
  // Parse FBH hole diameter from calibration settings
  const fbhSizeStr = data.calibration.fbhSizes?.split(',')[0]?.trim() || '3/64"';
  const holeDiameter = parseFbhSize(fbhSizeStr); // Convert "3/64" to mm

  // Generate calibration blocks based on part thickness (TÜV style - up to 12 blocks)
  const referenceBlocks = generateReferenceBlockSet(partThickness, holeDiameter, blockType);

  // Draw block diagram section
  const diagramWidth = pageWidth - 2 * margin;
  const diagramHeight = 65;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos, diagramWidth, diagramHeight);

  // Draw title inside diagram box
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Reference Block Configuration', margin + 5, yPos + 7);

  // Draw single representative block with FBH (pass diameter)
  const blockCenterX = margin + diagramWidth * 0.25;
  const blockCenterY = yPos + diagramHeight / 2 + 5;
  drawSingleReferenceBlock(doc, blockCenterX, blockCenterY, holeDiameter, partThickness, blockDiameter);

  // Draw side view / cross-section
  const sideViewX = margin + diagramWidth * 0.65;
  drawBlockSideView(doc, sideViewX, blockCenterY, holeDiameter, partThickness);

  yPos += diagramHeight + 8;

  // Reference Block Specifications Table (TÜV Table 2 style)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Table 2: Reference Block Specifications', margin, yPos);
  yPos += 6;

  // Build table data
  const tableBody: string[][] = referenceBlocks.map((block, index) => [
    block.identification,
    block.type,
    block.depth.toFixed(2),
    block.holeDiameter.toFixed(2),
    block.material,
    block.standard,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Identification', 'Type', 'Depth (mm)', 'Hole Ø (mm)', 'Material', 'Standard']],
    body: tableBody,
    theme: 'grid',
    headStyles: { 
      fillColor: [41, 128, 185], 
      textColor: 255, 
      fontSize: 9,
      halign: 'center'
    },
    bodyStyles: { 
      fontSize: 8,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 18 },
      2: { cellWidth: 24 },
      3: { cellWidth: 24 },
      4: { cellWidth: 35 },
      5: { cellWidth: 35 },
    },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Block Material & Standards section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Material & Standards', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  const materialSpecs = [
    `• Block Material: ${data.calibration.blockMaterial || 'Aluminum Alloy 7075-T6'}`,
    `• Material Standard: ${data.calibration.materialStandard || 'ASTM E127'}`,
    `• FBH Standard: ASTM E127 / EN 12223`,
    `• Hole Tolerance: ±0.05mm`,
    `• Surface Finish: ≤ 3.2 μm Ra`,
    `• Traceability: All blocks must have valid calibration certificates`,
  ];

  materialSpecs.forEach((spec) => {
    doc.text(spec, margin + 5, yPos);
    yPos += 5;
  });

  yPos += 8;

  // Calibration validity note
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Calibration Requirements', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const calibNotes = [
    '• Reference blocks must be calibrated annually or as required by applicable specification',
    '• Calibration certificates must accompany each reference block',
    '• Block temperature should match part temperature within ±5°C during calibration',
    '• Any block showing surface damage must be re-certified before use',
  ];

  calibNotes.forEach((note) => {
    doc.text(note, margin + 5, yPos);
    yPos += 5;
  });
}

/**
 * Generate a set of reference blocks based on part thickness (TÜV style)
 */
function generateReferenceBlockSet(
  partThickness: number,
  holeDiameter: number,
  blockType: string
): Array<{identification: string; type: string; depth: number; holeDiameter: number; material: string; standard: string}> {
  const blocks: Array<{identification: string; type: string; depth: number; holeDiameter: number; material: string; standard: string}> = [];
  
  // Calculate number of blocks needed based on thickness
  // TÜV typically uses 3-12 blocks depending on thickness range
  let depths: number[] = [];
  
  if (partThickness <= 25) {
    // Thin parts: 3 blocks
    depths = [
      partThickness * 0.3,
      partThickness * 0.6,
      partThickness * 0.9,
    ];
  } else if (partThickness <= 50) {
    // Medium parts: 5 blocks
    depths = [
      3.05,  // ~1/8"
      partThickness * 0.25,
      partThickness * 0.5,
      partThickness * 0.75,
      partThickness * 0.95,
    ];
  } else if (partThickness <= 100) {
    // Thick parts: 7 blocks
    depths = [
      3.05,   // ~1/8"
      6.35,   // 1/4"
      12.70,  // 1/2"
      25.40,  // 1"
      partThickness * 0.5,
      partThickness * 0.75,
      partThickness * 0.95,
    ];
  } else {
    // Very thick parts: up to 12 blocks
    depths = [
      3.05,   // ~1/8"
      6.35,   // 1/4"
      12.70,  // 1/2"
      25.40,  // 1"
      38.10,  // 1.5"
      50.80,  // 2"
      76.20,  // 3"
      partThickness * 0.5,
      partThickness * 0.6,
      partThickness * 0.7,
      partThickness * 0.85,
      partThickness * 0.95,
    ];
  }

  // Remove duplicates and sort
  depths = [...new Set(depths.map(d => Math.round(d * 100) / 100))].sort((a, b) => a - b);
  
  // Ensure max depth doesn't exceed part thickness
  depths = depths.filter(d => d <= partThickness * 0.95);

  // Generate block entries
  depths.forEach((depth, index) => {
    const depthInInches = depth / 25.4;
    const id = `3/${String(Math.round(depth * 10)).padStart(4, '0')}`;
    
    blocks.push({
      identification: id,
      type: 'FBH',
      depth: depth,
      holeDiameter: holeDiameter,
      material: 'Al 7075-T6',
      standard: 'ASTM E127',
    });
  });

  return blocks;
}

/**
 * Draw single reference block diagram (top view + annotations)
 */
function drawSingleReferenceBlock(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  holeDiameter: number,
  blockDepth: number,
  blockDiameter: number = 50.8 // Default 2" per ASTM E127
) {
  // Draw cylindrical block (top view - circle)
  const radius = 25;
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.setFillColor(240, 240, 240);
  doc.circle(centerX, centerY, radius, 'FD');

  // Draw FBH at center (smaller circle)
  const holeRadius = 3;
  doc.setFillColor(100, 100, 100);
  doc.circle(centerX, centerY, holeRadius, 'FD');

  // Dimension lines - diameter
  doc.setLineWidth(0.3);
  doc.setDrawColor(0, 0, 0);
  
  // Horizontal dimension line
  const dimY = centerY + radius + 12;
  doc.line(centerX - radius, dimY, centerX + radius, dimY);
  doc.line(centerX - radius, dimY - 2, centerX - radius, dimY + 2);
  doc.line(centerX + radius, dimY - 2, centerX + radius, dimY + 2);
  
  // Extension lines
  doc.setDrawColor(150, 150, 150);
  doc.line(centerX - radius, centerY + radius, centerX - radius, dimY - 2);
  doc.line(centerX + radius, centerY + radius, centerX + radius, dimY - 2);

  // Dimension text - DYNAMIC diameter
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const diameterText = blockDiameter === 50.8 
    ? 'Ø 50.8mm (2")' 
    : `Ø ${blockDiameter.toFixed(1)}mm`;
  doc.text(diameterText, centerX, dimY + 5, { align: 'center' });

  // Label
  doc.setFontSize(8);
  doc.text('TOP VIEW', centerX, centerY - radius - 5, { align: 'center' });
  
  // FBH label with arrow
  doc.setFontSize(7);
  doc.text(`FBH Ø${holeDiameter.toFixed(2)}mm`, centerX + holeRadius + 8, centerY - 3);
  doc.setDrawColor(0, 0, 0);
  doc.line(centerX + holeRadius + 2, centerY, centerX + holeRadius + 7, centerY - 2);
}

/**
 * Draw block side view / cross-section
 */
function drawBlockSideView(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  holeDiameter: number,
  blockDepth: number
) {
  const width = 40;
  const height = 35;
  const rectX = centerX - width / 2;
  const rectY = centerY - height / 2;

  // Draw block body
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.setFillColor(240, 240, 240);
  doc.rect(rectX, rectY, width, height, 'FD');

  // Draw FBH (from bottom)
  const holeWidth = 4;
  const holeDepth = height * 0.7;
  doc.setFillColor(100, 100, 100);
  doc.rect(centerX - holeWidth / 2, rectY + height - holeDepth, holeWidth, holeDepth, 'FD');

  // Bottom of hole indicator (dashed line)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(rectX + 2, rectY + height - holeDepth, rectX + width - 2, rectY + height - holeDepth);
  doc.setLineDashPattern([], 0);

  // Dimension - height
  const dimX = rectX + width + 8;
  doc.line(dimX, rectY, dimX, rectY + height);
  doc.line(dimX - 2, rectY, dimX + 2, rectY);
  doc.line(dimX - 2, rectY + height, dimX + 2, rectY + height);

  // Dimension text
  doc.setFontSize(7);
  doc.text('MTD', dimX + 5, centerY);

  // FBH depth dimension
  const fbhDimX = rectX - 8;
  doc.line(fbhDimX, rectY + height - holeDepth, fbhDimX, rectY + height);
  doc.line(fbhDimX - 2, rectY + height - holeDepth, fbhDimX + 2, rectY + height - holeDepth);
  doc.line(fbhDimX - 2, rectY + height, fbhDimX + 2, rectY + height);
  
  doc.setFontSize(7);
  doc.text('d', fbhDimX - 6, rectY + height - holeDepth / 2);

  // Label
  doc.setFontSize(8);
  doc.text('SIDE VIEW', centerX, rectY - 5, { align: 'center' });

  // Bottom surface label
  doc.setFontSize(7);
  doc.text('Entry Surface', centerX, rectY + height + 8, { align: 'center' });
}

function drawAcceptanceCriteriaPage(
  doc: jsPDF,
  data: ComprehensiveTechniqueSheetData,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Acceptance Criteria', margin, yPos);
  yPos += 10;

  // Acceptance criteria table
  doc.setFontSize(11);
  doc.text('Acceptance Standards', margin, yPos);
  yPos += 6;

  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: [
      ['Acceptance Class', data.acceptanceCriteria.acceptanceClass || 'N/A'],
      ['Single Discontinuity Limit', data.acceptanceCriteria.singleDiscontinuity || 'N/A'],
      ['Multiple Discontinuities', data.acceptanceCriteria.multipleDiscontinuities || 'N/A'],
      ['Linear Discontinuity', data.acceptanceCriteria.linearDiscontinuity || 'N/A'],
      ['Back Reflection Loss (%)', data.acceptanceCriteria.backReflectionLoss?.toString() || 'N/A'],
      ['Noise Level', data.acceptanceCriteria.noiseLevel || 'N/A'],
      ['Special Requirements', data.acceptanceCriteria.specialRequirements || 'None'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Recording and reporting
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Recording and Reporting Requirements', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const reportingNotes = [
    '• All indications exceeding acceptance criteria must be recorded',
    '• Record location, size, and character of all recordable indications',
    '• C-Scan and A-Scan images to be included in final report',
    '• Back wall loss greater than 50% must be investigated',
    '• Document any deviations from this technique sheet',
    '• All scans must be saved digitally and archived',
  ];

  reportingNotes.forEach((note) => {
    doc.text(note, margin + 5, yPos);
    yPos += 6;
  });

  yPos += 10;

  // Additional notes
  if (data.documentation.additionalNotes) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Notes', margin, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(data.documentation.additionalNotes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin + 5, yPos);
  }
}

function drawScanImagePage(
  doc: jsPDF,
  scanImage: string,
  imageNumber: number,
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let yPos = margin + 10;

  // Page title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Scan Image ${imageNumber}`, margin, yPos);
  yPos += 10;

  // Scan image area
  const imageHeight = pageHeight - 2 * margin - 40;
  const imageWidth = pageWidth - 2 * margin;

  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos, imageWidth, imageHeight);

  if (scanImage) {
    try {
      doc.addImage(scanImage, 'PNG', margin + 2, yPos + 2, imageWidth - 4, imageHeight - 4);
    } catch (error) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Scan image placeholder', pageWidth / 2, yPos + imageHeight / 2, { align: 'center' });
    }
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(`Scan Image ${imageNumber} - To be inserted`, pageWidth / 2, yPos + imageHeight / 2, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }

  // Image caption
  yPos += imageHeight + 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Figure ${imageNumber + 3}: Ultrasonic scan results`, pageWidth / 2, yPos, { align: 'center' });
}

function drawCalibrationBlockDetailed(
  doc: jsPDF,
  blockType: CalibrationBlockType,
  standardType: string,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.setFontSize(8);

  switch (blockType) {
    case 'flat_block':
      drawFlatBlockTechnical(doc, centerX, centerY);
      break;
    case 'curved_block':
      drawCurvedBlockTechnical(doc, centerX, centerY);
      break;
    case 'cylinder_fbh':
      drawHollowCylindricalFBHTechnical(doc, centerX, centerY);
      break;
    case 'angle_beam':
      drawAngleBeamBlockTechnical(doc, centerX, centerY);
      break;
    case 'cylinder_notched':
      drawHollowCylindricalNotchedTechnical(doc, centerX, centerY);
      break;
    case 'iiv_block':
      drawIIVBlockTechnical(doc, centerX, centerY);
      break;
    default:
      drawGenericBlock(doc, centerX, centerY);
  }
}

function drawFlatBlockTechnical(doc: jsPDF, centerX: number, centerY: number) {
  const blockWidth = 70;
  const blockHeight = 35;

  // Main block
  doc.rect(centerX - blockWidth / 2, centerY - blockHeight / 2, blockWidth, blockHeight);

  // FBH positions (3 holes)
  const fbhY = centerY;
  doc.circle(centerX - 20, fbhY, 2, 'S');
  doc.circle(centerX, fbhY, 2, 'S');
  doc.circle(centerX + 20, fbhY, 2, 'S');

  // Dimensions
  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  
  // Length dimension
  doc.line(centerX - blockWidth / 2, centerY + blockHeight / 2 + 5, centerX + blockWidth / 2, centerY + blockHeight / 2 + 5);
  doc.line(centerX - blockWidth / 2, centerY + blockHeight / 2 + 3, centerX - blockWidth / 2, centerY + blockHeight / 2 + 7);
  doc.line(centerX + blockWidth / 2, centerY + blockHeight / 2 + 3, centerX + blockWidth / 2, centerY + blockHeight / 2 + 7);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('L = 100mm', centerX, centerY + blockHeight / 2 + 12, { align: 'center' });

  // Height dimension
  doc.line(centerX - blockWidth / 2 - 5, centerY - blockHeight / 2, centerX - blockWidth / 2 - 5, centerY + blockHeight / 2);
  doc.line(centerX - blockWidth / 2 - 7, centerY - blockHeight / 2, centerX - blockWidth / 2 - 3, centerY - blockHeight / 2);
  doc.line(centerX - blockWidth / 2 - 7, centerY + blockHeight / 2, centerX - blockWidth / 2 - 3, centerY + blockHeight / 2);
  
  doc.text('H=25mm', centerX - blockWidth / 2 - 10, centerY);

  // FBH labels
  doc.setFontSize(6);
  doc.text('Ø3/64"', centerX - 20, fbhY - 5, { align: 'center' });
  doc.text('Ø5/64"', centerX, fbhY - 5, { align: 'center' });
  doc.text('Ø8/64"', centerX + 20, fbhY - 5, { align: 'center' });

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
}

function drawCurvedBlockTechnical(doc: jsPDF, centerX: number, centerY: number) {
  const blockWidth = 70;
  const blockHeight = 40;
  const radius = 50;

  // Curved surface
  doc.ellipse(centerX, centerY, blockWidth / 2, blockHeight / 2.5, 'S');

  // Center line
  doc.setDrawColor(150);
  doc.setLineWidth(0.2);
  doc.line(centerX, centerY - blockHeight / 2 - 10, centerX, centerY + blockHeight / 2 + 10);
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);

  // Radius annotation
  doc.setFontSize(7);
  doc.text(`R = ${radius}mm`, centerX + 10, centerY - blockHeight / 2 - 5);

  // Dimension
  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  doc.line(centerX - blockWidth / 2, centerY + blockHeight / 2 + 8, centerX + blockWidth / 2, centerY + blockHeight / 2 + 8);
  doc.text('L = 100mm', centerX, centerY + blockHeight / 2 + 15, { align: 'center' });
  
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
}

function drawHollowCylindricalFBHTechnical(doc: jsPDF, centerX: number, centerY: number) {
  const outerRadius = 30;
  const innerRadius = 22;

  // Outer circle
  doc.circle(centerX, centerY, outerRadius, 'S');

  // Inner circle
  doc.circle(centerX, centerY, innerRadius, 'S');

  // FBH positions
  doc.circle(centerX + 26, centerY, 1.5, 'F');
  doc.circle(centerX, centerY + 26, 1.5, 'F');
  doc.circle(centerX - 26, centerY, 1.5, 'F');
  doc.circle(centerX, centerY - 26, 1.5, 'F');

  // Dimensions
  doc.setDrawColor(100);
  doc.setLineWidth(0.3);
  
  // Outer diameter
  doc.line(centerX, centerY, centerX + outerRadius, centerY);
  doc.text('OD', centerX + outerRadius / 2, centerY - 2, { align: 'center' });

  // Wall thickness
  doc.line(centerX, centerY, centerX + innerRadius, centerY + 5);
  
  doc.setFontSize(7);
  doc.text(`t = ${outerRadius - innerRadius}mm`, centerX + outerRadius + 5, centerY);

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
}

function drawAngleBeamBlockTechnical(doc: jsPDF, centerX: number, centerY: number) {
  const blockWidth = 80;
  const blockHeight = 30;

  // Main block
  doc.rect(centerX - blockWidth / 2, centerY - blockHeight / 2, blockWidth, blockHeight);

  // Side-drilled holes
  const holeY = centerY;
  doc.circle(centerX - 25, holeY, 2.5, 'S');
  doc.circle(centerX, holeY, 2.5, 'S');
  doc.circle(centerX + 25, holeY, 2.5, 'S');

  // Beam angle lines
  doc.setDrawColor(150);
  doc.setLineWidth(0.3);
  
  const startX = centerX - blockWidth / 2 - 15;
  const startY = centerY + blockHeight / 2;
  
  // 45° angle
  const angle45X = centerX - 15;
  const angle45Y = centerY - 15;
  doc.line(startX, startY, angle45X, angle45Y);
  doc.text('45°', startX - 5, startY - 5);

  // 60° angle
  const angle60X = centerX;
  const angle60Y = centerY - 10;
  doc.line(startX, startY, angle60X, angle60Y);
  doc.text('60°', startX, startY - 10);

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
}

function drawHollowCylindricalNotchedTechnical(doc: jsPDF, centerX: number, centerY: number) {
  const outerRadius = 30;
  const innerRadius = 22;

  // Outer and inner circles
  doc.circle(centerX, centerY, outerRadius, 'S');
  doc.circle(centerX, centerY, innerRadius, 'S');

  // Notches (4 positions)
  const notchLength = 8;
  const notchWidth = 2;

  // Top notch
  doc.rect(centerX - notchWidth / 2, centerY - outerRadius, notchWidth, notchLength, 'F');
  // Right notch
  doc.rect(centerX + outerRadius - notchLength, centerY - notchWidth / 2, notchLength, notchWidth, 'F');
  // Bottom notch
  doc.rect(centerX - notchWidth / 2, centerY + outerRadius - notchLength, notchWidth, notchLength, 'F');
  // Left notch
  doc.rect(centerX - outerRadius, centerY - notchWidth / 2, notchLength, notchWidth, 'F');

  doc.setFontSize(7);
  doc.text('4 Notches', centerX, centerY + outerRadius + 8, { align: 'center' });
  doc.text('20% wall depth', centerX, centerY + outerRadius + 13, { align: 'center' });
}

function drawIIVBlockTechnical(doc: jsPDF, centerX: number, centerY: number) {
  const blockWidth = 75;
  const blockHeight = 32;

  // Main block
  doc.rect(centerX - blockWidth / 2, centerY - blockHeight / 2, blockWidth, blockHeight);

  // Step section
  const stepWidth = 25;
  const stepHeight = blockHeight / 2;
  doc.rect(centerX - blockWidth / 2, centerY - blockHeight / 2, stepWidth, stepHeight);

  // Radius section
  const radiusX = centerX + blockWidth / 4;
  doc.ellipse(radiusX, centerY - blockHeight / 4, 12, blockHeight / 4, 'S');

  // Holes
  doc.circle(centerX - 15, centerY, 2, 'S');
  doc.circle(centerX + 10, centerY, 2, 'S');
  doc.circle(centerX + 30, centerY, 2, 'S');

  doc.setFontSize(7);
  doc.text('IIW Type 1', centerX, centerY - blockHeight / 2 - 5, { align: 'center' });
  doc.text('100mm', centerX, centerY + blockHeight / 2 + 8, { align: 'center' });
}

function drawGenericBlock(doc: jsPDF, centerX: number, centerY: number) {
  const blockWidth = 60;
  const blockHeight = 30;

  doc.rect(centerX - blockWidth / 2, centerY - blockHeight / 2, blockWidth, blockHeight);
  doc.setFont('helvetica', 'italic');
  doc.text('Calibration Block', centerX, centerY, { align: 'center' });
  doc.text('(Technical Drawing)', centerX, centerY + 5, { align: 'center' });
}

function addPageNumbers(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  data: ComprehensiveTechniqueSheetData
) {
  const totalPages = doc.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(150);
    doc.setLineWidth(0.3);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    
    const footerLeft = `UT-TS | ${data.inspectionSetup.partNumber || 'N/A'}`;
    const footerCenter = `Page ${i} of ${totalPages}`;
    const footerRight = new Date().toLocaleDateString();
    
    doc.text(footerLeft, 15, pageHeight - 10);
    doc.text(footerCenter, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(footerRight, pageWidth - 15, pageHeight - 10, { align: 'right' });
    
    doc.setTextColor(0);
  }
}

function getBlockTypeName(blockType?: CalibrationBlockType): string {
  const names: Record<CalibrationBlockType, string> = {
    'flat_block': 'Flat Block with FBH',
    'curved_block': 'Curved Surface Reference Block',
    'cylinder_fbh': 'Hollow Cylindrical with FBH',
    'angle_beam': 'Angle Beam Test Block',
    'cylinder_notched': 'Hollow Cylindrical (Notched)',
    'iiv_block': 'IIW Type Block',
  };
  
  return blockType ? names[blockType] : 'N/A';
}

function getBlockFigureReference(blockType?: CalibrationBlockType): string {
  const figures: Record<CalibrationBlockType, string> = {
    'flat_block': 'Figure 4 - Flat Block with Flat-Bottom Holes (MIL-STD-2154)',
    'curved_block': 'Figure 3 - Convex Surface Reference Block (MIL-STD-2154)',
    'cylinder_fbh': 'Figure 6 - Hollow Cylindrical Block with FBH (MIL-STD-2154)',
    'cylinder_notched': 'Figure 5 - Hollow Cylindrical Notched Block (MIL-STD-2154)',
    'solid_cylinder_fbh': 'ASTM E127-20 - Solid Cylinder Set (3 Blocks) for Straight Beam',
    'angle_beam': 'Figure 8 - Angle Beam V1/V2 Test Block (MIL-STD-2154)',
    'iiv_block': 'Figure 7 - IIW Type Block (MIL-STD-2154)',
    'step_wedge': 'Figure 9 - Step Wedge Thickness Calibration Block',
    'iow_block': 'Figure 10 - IOW Type Reference Block',
    'custom': 'Custom Reference Block per Specification',
  };
  
  return blockType ? (figures[blockType] || 'Reference: MIL-STD-2154 / AMS-STD-2154') : 'Reference: MIL-STD-2154 / AMS-STD-2154';
}
