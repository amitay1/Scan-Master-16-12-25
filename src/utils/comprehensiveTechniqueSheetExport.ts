// @ts-nocheck
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
} from '@/types/techniqueSheet';

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

export function exportComprehensiveTechniqueSheet(data: ComprehensiveTechniqueSheetData): void {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // ============= PAGE 1: COVER PAGE =============
  drawCoverPage(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGE 2: EQUIPMENT & STANDARDS =============
  doc.addPage();
  drawEquipmentPage(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGE 3: CALIBRATION WITH DRAWING =============
  doc.addPage();
  drawCalibrationPage(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGE 4: PART DIAGRAM & SCAN SETUP =============
  doc.addPage();
  drawPartDiagramPage(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGE 5: SCAN PARAMETERS =============
  doc.addPage();
  drawScanParametersPage(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGE 6: ACCEPTANCE CRITERIA =============
  doc.addPage();
  drawAcceptanceCriteriaPage(doc, data, pageWidth, pageHeight, margin);

  // ============= PAGES 7+: SCAN IMAGES (if provided) =============
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

function drawEquipmentPage(
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
  doc.text('Equipment & Standards', margin, yPos);
  yPos += 10;

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

function drawCalibrationPage(
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
  doc.text('Calibration Block Details', margin, yPos);
  yPos += 10;

  // Calibration specifications
  doc.setFontSize(11);
  doc.text('Calibration Specifications', margin, yPos);
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

  // Technical Drawing Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Calibration Block - Technical Drawing', margin, yPos);
  yPos += 6;

  // Draw the calibration block
  const drawingHeight = 100;
  const drawingWidth = pageWidth - 2 * margin;
  
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos, drawingWidth, drawingHeight);

  drawCalibrationBlockDetailed(
    doc,
    (data.calibration.standardType as CalibrationBlockType) || 'flat_block',
    data.calibration.standardType || '',
    margin,
    yPos,
    drawingWidth,
    drawingHeight
  );

  yPos += drawingHeight + 10;

  // Figure reference
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(getBlockFigureReference(data.calibration.standardType as CalibrationBlockType), pageWidth / 2, yPos, { align: 'center' });
}

function drawPartDiagramPage(
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
  doc.text('Part Diagram & Inspection Setup', margin, yPos);
  yPos += 10;

  // Part diagram area
  const diagramHeight = 120;
  const diagramWidth = pageWidth - 2 * margin;

  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos, diagramWidth, diagramHeight);

  if (data.partDiagram) {
    try {
      doc.addImage(data.partDiagram, 'PNG', margin + 5, yPos + 5, diagramWidth - 10, diagramHeight - 10);
    } catch (error) {
      // If image loading fails, show placeholder
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Part Diagram', pageWidth / 2, yPos + diagramHeight / 2, { align: 'center' });
    }
  } else {
    // Placeholder for part diagram
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Part Diagram - To be inserted', pageWidth / 2, yPos + diagramHeight / 2, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }

  yPos += diagramHeight + 15;

  // Surface Condition
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Surface Condition Requirements', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const surfaceNotes = [
    '• Surface must be free from loose scale, machining particles, or foreign matter',
    '• Surface texture not rougher than 250 μin (6.3 μm Ra)',
    '• Clean parts before inspection',
    '• No local grinding depressions that interfere with inspection',
    '• Surface temperature: 10°C to 50°C',
  ];

  surfaceNotes.forEach((note) => {
    doc.text(note, margin + 5, yPos);
    yPos += 5;
  });
}

function drawScanParametersPage(
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
  doc.text('Scan Parameters & Plan', margin, yPos);
  yPos += 10;

  // Scan parameters table
  doc.setFontSize(11);
  doc.text('Scanning Parameters', margin, yPos);
  yPos += 6;

  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: [
      ['Scan Method', data.scanParameters.scanMethod || 'N/A'],
      ['Scan Type', data.scanParameters.scanType || 'N/A'],
      ['Scan Pattern', data.scanParameters.scanPattern || 'N/A'],
      ['Scan Speed (mm/s)', data.scanParameters.scanSpeed?.toString() || 'N/A'],
      ['Scan Index (mm)', data.scanParameters.scanIndex?.toString() || 'N/A'],
      ['Coverage (%)', data.scanParameters.coverage?.toString() || 'N/A'],
      ['Water Path (mm)', data.scanParameters.waterPath?.toString() || 'N/A'],
      ['Pulse Repetition Rate (Hz)', data.scanParameters.pulseRepetitionRate?.toString() || 'N/A'],
      ['Gain Settings (dB)', data.scanParameters.gainSettings || 'N/A'],
      ['Alarm Gate Settings', data.scanParameters.alarmGateSettings || 'N/A'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Scan plan table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Scan Plan', margin, yPos);
  yPos += 6;

  autoTable(doc, {
    startY: yPos,
    head: [['Seq.', 'Surface', 'Beam Wave', 'Direction', 'Sensitivity', 'Angle', 'Probe']],
    body: [
      ['1', 'Face A', 'Longitudinal', 'Axial', '3/64" FBH DAC', '0°', data.equipment.transducerType || 'MSEB2'],
      ['2', 'Face B', 'Longitudinal', 'Axial', '3/64" FBH DAC', '0°', data.equipment.transducerType || 'MSEB2'],
      ['3', 'OD', 'Longitudinal', 'Axial', '3/64" FBH DAC', '0°', data.equipment.transducerType || 'MSEB2'],
      ['4', 'OD', 'Shear', 'CW', '3/64" FBH DAC', '45°', 'MWB45-2'],
      ['5', 'OD', 'Shear', 'CCW', '3/64" FBH DAC', '45°', 'MWB45-2'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - 2 * margin,
  });
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
    case 'iiw_block':
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
  
  doc.text('H = 25mm', centerX - blockWidth / 2 - 12, centerY, { angle: 90, align: 'center' });

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
    'iiw_block': 'IIW Type Block',
  };
  
  return blockType ? names[blockType] : 'N/A';
}

function getBlockFigureReference(blockType?: CalibrationBlockType): string {
  const figures: Record<CalibrationBlockType, string> = {
    'flat_block': 'Figure 4 - Flat Block with Flat-Bottom Holes (MIL-STD-2154)',
    'curved_block': 'Figure 3 - Convex Surface Reference Block (MIL-STD-2154)',
    'cylinder_fbh': 'Figure 6 - Hollow Cylindrical Block with FBH (MIL-STD-2154)',
    'angle_beam': 'Figure 4 - Angle Beam Test Block (MIL-STD-2154)',
    'cylinder_notched': 'Figure 5 - Hollow Cylindrical Notched Block (MIL-STD-2154)',
    'iiw_block': 'Figure 7 - IIW Type Block (MIL-STD-2154)',
  };
  
  return blockType ? figures[blockType] : 'Reference: MIL-STD-2154 / AMS-STD-2154';
}
